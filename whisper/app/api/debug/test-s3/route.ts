import { NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";

export async function GET() {
  try {
    // Check if S3 env vars are set
    const envCheck = {
      S3_UPLOAD_BUCKET: !!process.env.S3_UPLOAD_BUCKET,
      S3_UPLOAD_KEY: !!process.env.S3_UPLOAD_KEY,
      S3_UPLOAD_SECRET: !!process.env.S3_UPLOAD_SECRET,
      S3_UPLOAD_REGION: !!process.env.S3_UPLOAD_REGION,
    };

    // Try to create S3 client
    let s3ClientWorking = false;
    let s3Error = null;
    
    try {
      const s3Client = new S3Client({
        region: process.env.S3_UPLOAD_REGION || "us-east-2",
        credentials: {
          accessKeyId: process.env.S3_UPLOAD_KEY!,
          secretAccessKey: process.env.S3_UPLOAD_SECRET!,
        },
      });
      s3ClientWorking = !!s3Client;
    } catch (error: any) {
      s3Error = error.message;
    }

    return NextResponse.json({
      envVariables: envCheck,
      s3Client: {
        working: s3ClientWorking,
        error: s3Error,
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