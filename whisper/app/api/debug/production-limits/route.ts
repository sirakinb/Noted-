import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMinutesLeft, getTransformationsLeft } from "@/lib/limits";
import { getClerkUserSubscription } from "@/lib/clerk-billing";
import { Redis } from "@upstash/redis";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check Redis connection
    const hasRedisEnv = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    let redisWorking = false;
    
    if (hasRedisEnv) {
      try {
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
        await redis.ping();
        redisWorking = true;
      } catch (error) {
        console.error('Redis connection failed:', error);
      }
    }

    // Get subscription info
    const clerkSubscription = await getClerkUserSubscription(userId);
    
    // Get limits
    const minutesLeft = await getMinutesLeft(userId);
    const transformationsLeft = await getTransformationsLeft(userId);

    return NextResponse.json({
      userId,
      environment: process.env.NODE_ENV,
      redis: {
        hasEnvVars: hasRedisEnv,
        working: redisWorking,
        url: process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'NOT SET',
        token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'NOT SET',
      },
      subscriptions: {
        clerk: clerkSubscription,
      },
      limits: {
        minutes: minutesLeft,
        transformations: transformationsLeft,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in production-limits debug:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
} 