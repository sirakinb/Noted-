import { clerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@/lib/generated/prisma";

const clerk = clerkClient();

// Define plan limits based on Clerk billing features
export const CLERK_PLAN_LIMITS = {
  free: {
    minutesLimit: 5,
    transformationsLimit: 10,
  },
  trial: {
    minutesLimit: 5,
    transformationsLimit: 10,
  },
  starter: {
    minutesLimit: 480, // 8 hours
    transformationsLimit: 50,
  },
  pro: {
    minutesLimit: 1500, // 25 hours
    transformationsLimit: null, // unlimited
  },
};

// Get user's subscription status from Clerk
export async function getClerkUserSubscription(userId: string) {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    console.log('Clerk user data for', userId, ':', {
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
      createdAt: user.createdAt,
    });
    
    // Check if user has any active subscriptions in publicMetadata
    const subscriptions = user.publicMetadata?.subscriptions as any;
    const planId = user.publicMetadata?.planId as string;
    
    // If user has a planId in publicMetadata, use that
    if (planId && CLERK_PLAN_LIMITS[planId as keyof typeof CLERK_PLAN_LIMITS]) {
      console.log('User has planId in publicMetadata:', planId);
      return {
        tier: planId,
        status: 'active',
        features: CLERK_PLAN_LIMITS[planId as keyof typeof CLERK_PLAN_LIMITS],
      };
    }
    
    // If no subscriptions or empty subscriptions, give FREE limits (default for new users)
    if (!subscriptions || Object.keys(subscriptions).length === 0) {
      console.log('No subscriptions found, returning free limits');
      return {
        tier: 'free',
        status: 'active',
        features: CLERK_PLAN_LIMITS.free,
      };
    }
    
    // Find the highest tier subscription
    let highestTier = 'free'; // Default to free for new users
    let activeSubscription = null;
    
    for (const [planId, subscription] of Object.entries(subscriptions)) {
      const sub = subscription as any;
      if (sub.status === 'active' && sub.tier) {
        if (sub.tier === 'pro') {
          highestTier = 'pro';
          activeSubscription = sub;
          break;
        } else if (sub.tier === 'starter' && highestTier !== 'pro') {
          highestTier = 'starter';
          activeSubscription = sub;
        }
      }
    }
    
    console.log('Found subscription tier:', highestTier);
    
    return {
      tier: highestTier,
      status: 'active',
      features: CLERK_PLAN_LIMITS[highestTier as keyof typeof CLERK_PLAN_LIMITS],
      subscription: activeSubscription,
    };
  } catch (error) {
    console.error('Error getting Clerk user subscription:', error);
    // Default to free limits if there's an error
    return {
      tier: 'free',
      status: 'active',
      features: CLERK_PLAN_LIMITS.free,
    };
  }
}

// Sync user data between Clerk and Neon database
export async function syncUserWithDatabase(userId: string) {
  const prisma = new PrismaClient();
  
  try {
    // Get user data from Clerk
    const clerkSubscription = await getClerkUserSubscription(userId);
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const clerkPlanId = clerkUser.publicMetadata?.planId as string;
    
    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: email,
        subscriptionTier: clerkSubscription.tier,
        subscriptionStatus: clerkSubscription.status,
        clerkPlanId: clerkPlanId,
        lastSyncedAt: new Date(),
        monthlyMinutesUsed: 0,
        monthlyTransformationsUsed: 0,
        usageResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // Next month
      },
      update: {
        email: email,
        subscriptionTier: clerkSubscription.tier,
        subscriptionStatus: clerkSubscription.status,
        clerkPlanId: clerkPlanId,
        lastSyncedAt: new Date(),
      },
    });
    
    console.log('Synced user with database:', user);
    return user;
    
  } catch (error) {
    console.error('Error syncing user with database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Update all existing users to align with new schema
export async function migrateExistingUsers() {
  const prisma = new PrismaClient();
  
  try {
    // Get all users from database
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      try {
        // Map old subscription tiers to new ones
        let newTier = user.subscriptionTier;
        
        // Convert old "none" to "free"
        if (user.subscriptionTier === null || user.subscriptionTier === 'none') {
          newTier = 'free';
        }
        
        // Ensure status is appropriate
        let newStatus = user.subscriptionStatus;
        if (newTier === 'free' && user.subscriptionStatus === 'inactive') {
          newStatus = 'active'; // Free users should be active
        }
        
        // Update user with new schema
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: newTier,
            subscriptionStatus: newStatus,
            clerkPlanId: newTier, // Set clerkPlanId to match tier
            lastSyncedAt: new Date(),
            monthlyMinutesUsed: 0,
            monthlyTransformationsUsed: 0,
            usageResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        });
        
        // Also update Clerk metadata to match
        await setUserPlan(user.id, newTier as keyof typeof CLERK_PLAN_LIMITS);
        
        console.log(`Migrated user ${user.id}: ${user.subscriptionTier} -> ${newTier}`);
        
      } catch (error) {
        console.error(`Error migrating user ${user.id}:`, error);
      }
    }
    
    console.log('Migration completed');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Check if user has access to a specific feature
export async function hasFeature(userId: string, feature: string): Promise<boolean> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const features = user.publicMetadata?.features as Record<string, any> || {};
    
    return !!features[feature];
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

// Get user's plan limits
export async function getPlanLimits(userId: string) {
  const subscription = await getClerkUserSubscription(userId);
  return subscription.features;
}

// Helper function to set user's plan in Clerk (for testing/admin use)
export async function setUserPlan(userId: string, planId: keyof typeof CLERK_PLAN_LIMITS) {
  try {
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        planId: planId,
      },
    });
    console.log(`Set user ${userId} to plan ${planId}`);
    return true;
  } catch (error) {
    console.error('Error setting user plan:', error);
    return false;
  }
} 