import { NextRequest, NextResponse } from 'next/server';
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

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing stripe signature or webhook secret' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          console.error('Missing userId or planId in session metadata');
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // Get the plan details
        const plan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS];
        if (!plan) {
          console.error('Invalid plan ID:', planId);
          return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // Update user subscription
        await prisma.user.upsert({
          where: { id: userId },
          update: {
            subscriptionTier: planId,
            subscriptionStatus: 'active',
            subscriptionId: session.subscription || session.customer,
            updatedAt: new Date(),
          },
          create: {
            id: userId,
            email: session.customer_details?.email || '',
            subscriptionTier: planId,
            subscriptionStatus: 'active',
            subscriptionId: session.subscription || session.customer,
          },
        });

        console.log(`Subscription activated for user ${userId} with plan ${planId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('Missing userId in subscription metadata');
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // Update subscription status
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: subscription.status,
            updatedAt: new Date(),
          },
        });

        console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('Missing userId in subscription metadata');
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // Update subscription status to canceled
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'canceled',
            updatedAt: new Date(),
          },
        });

        console.log(`Subscription canceled for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 