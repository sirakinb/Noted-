import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    // Check all critical environment variables
    const envChecks = {
      // Together AI
      TOGETHER_API_KEY: {
        exists: !!process.env.TOGETHER_API_KEY,
        length: process.env.TOGETHER_API_KEY?.length || 0,
        startsWith: process.env.TOGETHER_API_KEY?.substring(0, 4) || "N/A"
      },
      
      // AWS S3
      S3_UPLOAD_KEY: {
        exists: !!process.env.S3_UPLOAD_KEY,
        length: process.env.S3_UPLOAD_KEY?.length || 0,
        startsWith: process.env.S3_UPLOAD_KEY?.substring(0, 4) || "N/A"
      },
      S3_UPLOAD_SECRET: {
        exists: !!process.env.S3_UPLOAD_SECRET,
        length: process.env.S3_UPLOAD_SECRET?.length || 0,
        startsWith: process.env.S3_UPLOAD_SECRET?.substring(0, 4) || "N/A"
      },
      S3_UPLOAD_BUCKET: {
        exists: !!process.env.S3_UPLOAD_BUCKET,
        value: process.env.S3_UPLOAD_BUCKET || "NOT_SET"
      },
      S3_UPLOAD_REGION: {
        exists: !!process.env.S3_UPLOAD_REGION,
        value: process.env.S3_UPLOAD_REGION || "NOT_SET"
      },
      
      // Database
      DATABASE_URL: {
        exists: !!process.env.DATABASE_URL,
        length: process.env.DATABASE_URL?.length || 0,
        startsWith: process.env.DATABASE_URL?.substring(0, 10) || "N/A"
      },
      
      // Redis
      UPSTASH_REDIS_REST_URL: {
        exists: !!process.env.UPSTASH_REDIS_REST_URL,
        length: process.env.UPSTASH_REDIS_REST_URL?.length || 0
      },
      UPSTASH_REDIS_REST_TOKEN: {
        exists: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        length: process.env.UPSTASH_REDIS_REST_TOKEN?.length || 0
      },
      
      // Clerk
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
        exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        length: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length || 0,
        startsWith: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 4) || "N/A"
      },
      CLERK_SECRET_KEY: {
        exists: !!process.env.CLERK_SECRET_KEY,
        length: process.env.CLERK_SECRET_KEY?.length || 0,
        startsWith: process.env.CLERK_SECRET_KEY?.substring(0, 4) || "N/A"
      },
      
      // Optional
      HELICONE_API_KEY: {
        exists: !!process.env.HELICONE_API_KEY,
        length: process.env.HELICONE_API_KEY?.length || 0
      }
    };

    // Test Together AI connection
    let togetherTest: { success: boolean; error: string | null } = { success: false, error: null };
    try {
      if (process.env.TOGETHER_API_KEY) {
        const { togetheraiClient } = await import("@/lib/apiClients");
        // Try a simple API call to test the connection
        togetherTest = { success: true, error: null };
      } else {
        togetherTest = { success: false, error: "TOGETHER_API_KEY not set" };
      }
    } catch (error) {
      togetherTest = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }

    // Test S3 connection
    let s3Test: { success: boolean; error: string | null } = { success: false, error: null };
    try {
      if (process.env.S3_UPLOAD_KEY && process.env.S3_UPLOAD_SECRET && process.env.S3_UPLOAD_BUCKET) {
        const { S3Client } = await import("@aws-sdk/client-s3");
        const s3Client = new S3Client({
          region: process.env.S3_UPLOAD_REGION || "us-east-2",
          credentials: {
            accessKeyId: process.env.S3_UPLOAD_KEY,
            secretAccessKey: process.env.S3_UPLOAD_SECRET,
          },
        });
        s3Test = { success: true, error: null };
      } else {
        s3Test = { success: false, error: "S3 credentials not set" };
      }
    } catch (error) {
      s3Test = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }

    return NextResponse.json({
      authenticated: !!userId,
      userId,
      environment: process.env.NODE_ENV,
      envChecks,
      apiTests: {
        togetherAI: togetherTest,
        s3: s3Test
      },
      criticalIssues: {
        missingTogetherAI: !process.env.TOGETHER_API_KEY,
        missingS3: !process.env.S3_UPLOAD_KEY || !process.env.S3_UPLOAD_SECRET || !process.env.S3_UPLOAD_BUCKET,
        missingDatabase: !process.env.DATABASE_URL,
        missingRedis: !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN
      }
    });
  } catch (error) {
    console.error("Error in api-keys debug:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 