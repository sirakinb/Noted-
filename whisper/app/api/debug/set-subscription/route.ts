import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { subscriptionTier, subscriptionStatus } = await request.json();

    if (!subscriptionTier || !subscriptionStatus) {
      return NextResponse.json(
        { error: 'Missing subscriptionTier or subscriptionStatus' },
        { status: 400 }
      );
    }

    // Update or create user subscription
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        subscriptionTier,
        subscriptionStatus,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        email: 'debug@example.com', // Placeholder email
        subscriptionTier,
        subscriptionStatus,
      },
    });

    return NextResponse.json({
      message: 'Subscription updated successfully',
      user: {
        id: user.id,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Set subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to set subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 