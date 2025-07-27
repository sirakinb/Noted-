import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMinutesLeft } from '@/lib/limits';
import { getPlanLimits } from '@/lib/revenuecat';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Test the minutes calculation
    const minutesResult = await getMinutesLeft(userId);
    
    // Also test the plan limits
    const planLimits = getPlanLimits(null); // null for trial user
    
    return NextResponse.json({
      userId,
      minutesResult,
      planLimits,
      environment: process.env.NODE_ENV,
      hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    });
  } catch (error) {
    console.error('Error testing minutes:', error);
    return NextResponse.json(
      { error: 'Failed to test minutes', details: (error as Error).message },
      { status: 500 }
    );
  }
} 