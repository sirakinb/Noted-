import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    TOGETHER_API_KEY: process.env.TOGETHER_API_KEY ? "SET" : "MISSING",
    S3_UPLOAD_BUCKET: process.env.S3_UPLOAD_BUCKET ? "SET" : "MISSING", 
    S3_UPLOAD_KEY: process.env.S3_UPLOAD_KEY ? "SET" : "MISSING",
    S3_UPLOAD_SECRET: process.env.S3_UPLOAD_SECRET ? "SET" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? "SET" : "MISSING",
    timestamp: new Date().toISOString(),
  });
} 