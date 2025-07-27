import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getPlanLimits } from '@/lib/revenuecat';

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

    console.log('Checking subscription for user:', userId);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        message: 'User not found in database',
        userId,
        subscription: null,
        limits: getPlanLimits(null)
      });
    }

    const limits = getPlanLimits(user.subscriptionTier);

    return NextResponse.json({
      user,
      subscription: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        endsAt: user.subscriptionEndsAt,
      },
      limits,
      message: `User has ${user.subscriptionTier} subscription with ${limits.transformationsLimit} transformations and ${limits.minutesLimit} minutes`
    });
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription', details: error.message },
      { status: 500 }
    );
  }
} 