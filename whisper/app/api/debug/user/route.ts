import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      userId,
      message: 'Copy this userId to update your subscription manually'
    });
  } catch (error) {
    console.error('Error getting user ID:', error);
    return NextResponse.json(
      { error: 'Failed to get user ID' },
      { status: 500 }
    );
  }
} 