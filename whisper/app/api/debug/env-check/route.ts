import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      hasStripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
      hasClerk: !!(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
      hasDatabase: !!process.env.DATABASE_URL,
      hasTogetherAI: !!process.env.TOGETHER_API_KEY,
      redisUrl: process.env.UPSTASH_REDIS_REST_URL ? 'Set' : 'Not set',
      stripeKey: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not set',
    };

    return NextResponse.json(envCheck);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    );
  }
} 