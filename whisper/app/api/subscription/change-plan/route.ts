import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { PrismaClient } from '@/lib/generated/prisma';
import { STRIPE_PLANS } from '@/lib/stripe';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { newPlanId } = await request.json();

    if (!newPlanId || !(newPlanId in STRIPE_PLANS)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const newPlan = STRIPE_PLANS[newPlanId as keyof typeof STRIPE_PLANS];

    // Get current user subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionId: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has an active subscription
    if (!user.subscriptionStatus || user.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription to change. Please subscribe first.' },
        { status: 400 }
      );
    }

    // If they're already on this plan, no need to change
    if (user.subscriptionTier === newPlanId) {
      return NextResponse.json(
        { error: 'Already subscribed to this plan' },
        { status: 400 }
      );
    }

    let updatedUser;

    // If user has a Stripe subscription ID, use Stripe's proration
    if (user.subscriptionId) {
      try {
        // Get the current subscription from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: user.subscriptionId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          return NextResponse.json(
            { error: 'No active Stripe subscription found' },
            { status: 404 }
          );
        }

        const currentSubscription = subscriptions.data[0];
        const currentPriceId = currentSubscription.items.data[0].price.id;

        // If they're already on this plan, no need to change
        if (currentPriceId === newPlan.stripePriceId) {
          return NextResponse.json(
            { error: 'Already subscribed to this plan' },
            { status: 400 }
          );
        }

        // Update the subscription with proration
        const updatedSubscription = await stripe.subscriptions.update(
          currentSubscription.id,
          {
            items: [
              {
                id: currentSubscription.items.data[0].id,
                price: newPlan.stripePriceId,
              },
            ],
            proration_behavior: 'create_prorations', // This creates prorated charges/credits
            billing_cycle_anchor: 'now', // Start the new billing cycle immediately
          }
        );

        // Update user in database
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: newPlanId,
            subscriptionStatus: updatedSubscription.status,
            updatedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          subscription: {
            id: updatedSubscription.id,
            status: updatedSubscription.status,
            tier: newPlanId,
            currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
          },
          user: {
            id: updatedUser.id,
            subscriptionTier: updatedUser.subscriptionTier,
            subscriptionStatus: updatedUser.subscriptionStatus,
          },
          message: `Successfully upgraded to ${newPlan.displayName} plan with proration`,
        });
      } catch (stripeError) {
        console.error('Stripe subscription update failed:', stripeError);
        return NextResponse.json(
          { error: 'Failed to update Stripe subscription' },
          { status: 500 }
        );
      }
    } else {
      // Manual subscription - just update the database
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: newPlanId,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: null,
          status: 'active',
          tier: newPlanId,
          currentPeriodEnd: user.subscriptionEndsAt,
        },
        user: {
          id: updatedUser.id,
          subscriptionTier: updatedUser.subscriptionTier,
          subscriptionStatus: updatedUser.subscriptionStatus,
        },
        message: `Successfully upgraded to ${newPlan.displayName} plan`,
      });
    }

  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to change subscription plan' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 