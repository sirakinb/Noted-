import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log('Testing database connection for user:', userId);

    // Test database connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection test:', dbTest);

    // Get Clerk user info
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    console.log('Clerk user email:', userEmail);

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('Existing user in database:', dbUser);

    // If user doesn't exist, try to create them
    if (!dbUser) {
      console.log('User does not exist, creating...');
      
      try {
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            email: userEmail || 'no-email@example.com',
            subscriptionTier: 'none',
            subscriptionStatus: 'inactive',
            subscriptionId: null,
            subscriptionEndsAt: null,
          }
        });
        console.log('Successfully created user:', dbUser);
      } catch (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({
          error: "Failed to create user",
          details: createError instanceof Error ? createError.message : "Unknown error",
          stack: createError instanceof Error ? createError.stack : undefined
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "Database test completed",
      userId,
      userEmail,
      databaseConnection: "OK",
      userExists: !!dbUser,
      databaseUser: dbUser ? {
        id: dbUser.id,
        email: dbUser.email,
        subscriptionTier: dbUser.subscriptionTier,
        subscriptionStatus: dbUser.subscriptionStatus,
        createdAt: dbUser.createdAt,
      } : null,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Error in test-db:", error);
    return NextResponse.json({
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