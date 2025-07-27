import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    // Get subscription info using our function
    const { getClerkUserSubscription } = await import("@/lib/clerk-billing");
    const subscription = await getClerkUserSubscription(userId);
    
    return NextResponse.json({
      userId,
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        publicMetadata: user.publicMetadata,
        privateMetadata: user.privateMetadata,
      },
      subscription,
      planLimits: subscription.features,
    });
  } catch (error) {
    console.error("Error in clerk-subscription debug:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 