import { NextRequest } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const prisma = new PrismaClient();
  
  try {
    // Auth check
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const { tier, status, customerId } = body;

    // Validate input
    if (!tier || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }

    // Update or create user subscription
    const user = await prisma.user.upsert({
      where: {
        id: auth.userId,
      },
      update: {
        subscriptionTier: tier,
        subscriptionStatus: status,
        subscriptionId: customerId || null,
        subscriptionEndsAt: null, // For monthly subscriptions, this would be calculated
        updatedAt: new Date(),
      },
      create: {
        id: auth.userId,
        email: auth.sessionClaims?.email as string || "",
        subscriptionTier: tier,
        subscriptionStatus: status,
        subscriptionId: customerId || null,
        subscriptionEndsAt: null,
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: user.id,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
      }
    }), {
      status: 200,
    });

  } catch (error) {
    console.error("Subscription update error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  } finally {
    await prisma.$disconnect();
  }
} 