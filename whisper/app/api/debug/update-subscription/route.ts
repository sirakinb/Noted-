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

    const { tier = 'starter' } = await request.json();

    console.log('Updating subscription for user:', userId, 'to tier:', tier);
    
    // Try to update, if user doesn't exist, create them
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: tier,
          subscriptionStatus: 'active',
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        // User doesn't exist, create them
        console.log('User not found, creating new user:', userId);
        updatedUser = await prisma.user.create({
          data: {
            id: userId,
            email: 'temp@example.com', // Required field, will be updated later
            subscriptionTier: tier,
            subscriptionStatus: 'active',
            subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });
      } else {
        throw error;
      }
    }

    console.log('Subscription updated successfully:', updatedUser);

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${tier} tier`,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription', details: error.message },
      { status: 500 }
    );
  }
} 