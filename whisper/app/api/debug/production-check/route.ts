import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getPlanLimits, hasActiveSubscription } from '@/lib/revenuecat';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionId: true,
        subscriptionEndsAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        message: 'User not found in database',
        userId,
        shouldCreate: true,
      });
    }

    // Get plan limits
    const planLimits = getPlanLimits(user.subscriptionTier);
    const isActive = hasActiveSubscription(user.subscriptionStatus);

    return NextResponse.json({
      user,
      planLimits,
      isActive,
      environment: process.env.NODE_ENV,
      hasRedis: !!process.env.UPSTASH_REDIS_REST_URL,
      hasStripe: !!process.env.STRIPE_SECRET_KEY,
      hasClerk: !!process.env.CLERK_SECRET_KEY,
    });
  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json(
      { error: 'Debug check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 