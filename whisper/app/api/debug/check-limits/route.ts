import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMinutesLeft, getTransformationsLeft } from "@/lib/limits";
import { getClerkUserSubscription } from "@/lib/clerk-billing";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get subscription info from Clerk
    const clerkSubscription = await getClerkUserSubscription(userId);
    
    // Get limits
    const minutesLeft = await getMinutesLeft(userId);
    const transformationsLeft = await getTransformationsLeft(userId);

    return NextResponse.json({
      userId,
      clerkSubscription,
      minutesLeft,
      transformationsLeft,
      environment: process.env.NODE_ENV,
      hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    });
  } catch (error) {
    console.error('Error in check-limits:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 