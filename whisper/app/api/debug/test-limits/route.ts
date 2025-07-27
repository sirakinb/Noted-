import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getMinutesLeft, getTransformationsLeft } from "@/lib/limits";
import { getClerkUserSubscription } from "@/lib/clerk-billing";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get subscription info
    const subscription = await getClerkUserSubscription(userId);
    
    // Get limits
    const minutesData = await getMinutesLeft(userId);
    const transformationsData = await getTransformationsLeft(userId);
    
    return NextResponse.json({
      userId,
      subscription,
      minutesData,
      transformationsData,
      environment: process.env.NODE_ENV,
      hasRedis: !!process.env.UPSTASH_REDIS_REST_URL,
    });
  } catch (error) {
    console.error("Error in test-limits:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 