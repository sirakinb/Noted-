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

    // Get Clerk user info
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ 
        error: "No email found for user" 
      }, { status: 400 });
    }

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Create user in database if they don't exist - with FREE settings
    if (!dbUser) {
      console.log('Creating user in database with free settings:', userId, userEmail);
      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: userEmail,
          subscriptionTier: 'none', // New users start with no subscription
          subscriptionStatus: 'inactive', // Inactive until they choose a plan
          subscriptionId: null,
          subscriptionEndsAt: null,
        }
      });
    } else {
      console.log('User already exists in database:', userId);
    }

    // Set FREE limits in Clerk metadata (this gives them 5 minutes, 10 transformations)
    await setUserPlan(userId, 'free');

    // Get updated subscription status
    const clerkSubscription = await getClerkUserSubscription(userId);
    
    return NextResponse.json({
      message: "User created/updated with proper FREE limits",
      userId,
      userEmail,
      databaseUser: {
        id: dbUser.id,
        email: dbUser.email,
        subscriptionTier: dbUser.subscriptionTier,
        subscriptionStatus: dbUser.subscriptionStatus,
        createdAt: dbUser.createdAt,
      },
      clerkSubscription,
      expectedLimits: {
        minutes: 5,
        transformations: 10,
        note: "These are FREE limits for new users"
      },
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Error in fix-user debug:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST() {
  // Allow both GET and POST for easier testing
  return GET();
} 