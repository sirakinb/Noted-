import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return NextResponse.json({
        message: 'User already exists in database',
        user: existingUser,
      });
    }

    // Create new user with trial/default settings
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: '', // Will be updated when they complete a subscription
        subscriptionTier: null, // Trial user
        subscriptionStatus: 'inactive',
        subscriptionId: null,
      },
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: (error as Error).message },
      { status: 500 }
    );
  }
} 