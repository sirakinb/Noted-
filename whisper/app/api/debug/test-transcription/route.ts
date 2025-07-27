import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check environment variables
    const envCheck = {
      TOGETHER_API_KEY: !!process.env.TOGETHER_API_KEY,
      S3_UPLOAD_BUCKET: !!process.env.S3_UPLOAD_BUCKET,
      S3_UPLOAD_KEY: !!process.env.S3_UPLOAD_KEY,
      S3_UPLOAD_SECRET: !!process.env.S3_UPLOAD_SECRET,
      S3_UPLOAD_REGION: !!process.env.S3_UPLOAD_REGION,
      DATABASE_URL: !!process.env.DATABASE_URL,
      UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    };

    // Test Together AI client
    let togetherWorking = false;
    let togetherError = null;
    try {
      const { togetherBaseClientWithKey } = await import("@/lib/apiClients");
      const client = togetherBaseClientWithKey();
      // Just test if the client is created successfully
      togetherWorking = !!client;
    } catch (error: any) {
      togetherError = error.message;
    }

    return NextResponse.json({
      userId,
      environment: process.env.NODE_ENV,
      envVariables: envCheck,
      togetherAI: {
        working: togetherWorking,
        error: togetherError,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
} 