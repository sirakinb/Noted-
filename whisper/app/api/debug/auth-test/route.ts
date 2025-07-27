import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    return NextResponse.json({
      authenticated: !!userId,
      userId: userId || null,
      headers: Object.fromEntries(request.headers.entries()),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Authentication check failed',
      details: (error as Error).message,
      authenticated: false,
    });
  }
} 