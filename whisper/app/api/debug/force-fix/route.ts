import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { setUserPlan, getClerkUserSubscription } from "@/lib/clerk-billing";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log('FORCE FIXING USER:', userId);

    // Get Clerk user info
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ 
        error: "No email found for user" 
      }, { status: 400 });
    }

    console.log('User email:', userEmail);

    // FORCE UPDATE OR CREATE USER IN DATABASE
    let dbUser;
    try {
      // Try to update first
      dbUser = await prisma.user.update({
        where: { id: userId },
        data: {
          email: userEmail,
          subscriptionTier: 'none',
          subscriptionStatus: 'inactive',
          subscriptionId: null,
          subscriptionEndsAt: null,
          updatedAt: new Date(),
        }
      });
      console.log('Updated existing user in database:', dbUser);
    } catch (updateError) {
      console.log('User not found, creating new user...');
      // If update fails, create new user
      try {
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            email: userEmail,
            subscriptionTier: 'none',
            subscriptionStatus: 'inactive',
            subscriptionId: null,
            subscriptionEndsAt: null,
          }
        });
        console.log('Created new user in database:', dbUser);
      } catch (createError) {
        console.error('Failed to create user:', createError);
        throw createError;
      }
    }

    // FORCE SET FREE PLAN IN CLERK
    console.log('Setting FREE plan in Clerk metadata...');
    await setUserPlan(userId, 'free');

    // VERIFY THE CLERK METADATA WAS SET
    const updatedClerkUser = await clerk.users.getUser(userId);
    console.log('Updated Clerk user metadata:', updatedClerkUser.publicMetadata);

    // Get subscription status to verify
    const clerkSubscription = await getClerkUserSubscription(userId);
    console.log('Clerk subscription after update:', clerkSubscription);
    
    return NextResponse.json({
      success: true,
      message: "FORCE FIXED: User database record and Clerk metadata updated",
      userId,
      userEmail,
      databaseUser: {
        id: dbUser.id,
        email: dbUser.email,
        subscriptionTier: dbUser.subscriptionTier,
        subscriptionStatus: dbUser.subscriptionStatus,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      },
      clerkMetadata: updatedClerkUser.publicMetadata,
      clerkSubscription,
      expectedLimits: {
        minutes: 5,
        transformations: 10,
        note: "FREE plan limits - should work now!"
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in force-fix:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : "Unknown"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST() {
  return GET();
} 