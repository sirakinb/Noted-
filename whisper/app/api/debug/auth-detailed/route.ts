import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    // Get all headers
    const headers = Object.fromEntries(request.headers.entries());
    
    // Filter to show only relevant headers
    const relevantHeaders = {
      'authorization': headers.authorization,
      'cookie': headers.cookie ? headers.cookie.substring(0, 200) + '...' : null,
      'user-agent': headers['user-agent'],
      'referer': headers.referer,
      'origin': headers.origin,
      'host': headers.host,
    };
    
    // Check for Clerk-specific headers
    const clerkHeaders = Object.fromEntries(
      Object.entries(headers).filter(([key]) => 
        key.toLowerCase().includes('clerk') || 
        key.toLowerCase().includes('authorization')
      )
    );
    
    return NextResponse.json({
      authenticated: !!userId,
      userId,
      environment: process.env.NODE_ENV,
      relevantHeaders,
      clerkHeaders,
      allHeaders: headers,
      timestamp: new Date().toISOString(),
      clerkKeys: {
        publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...',
        secretKey: process.env.CLERK_SECRET_KEY?.substring(0, 10) + '...',
      }
    });
  } catch (error) {
    console.error("Error in auth-detailed debug:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 