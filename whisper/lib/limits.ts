import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { clerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { getClerkUserSubscription, CLERK_PLAN_LIMITS, syncUserWithDatabase } from "./clerk-billing";

const redis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : undefined;

const isLocal = process.env.NODE_ENV !== "production";

// Simple in-memory counter for local development
const localUsageCounters = new Map<string, { transformations: number; minutes: number; lastReset: number }>();
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const WINDOW = "1440 m"; // 1 day

// Create rate limiters for different subscription tiers
const createRateLimiters = () => {
  if (isLocal || !redis) return null;

  return {
    // Free plan: 5 minutes, 10 transformations
    free: {
      minutes: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(5, WINDOW),
        analytics: true,
      }),
      transformations: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(10, WINDOW),
        analytics: true,
      }),
    },
    // Free trial: 5 minutes, 10 transformations
    trial: {
      minutes: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(5, WINDOW),
        analytics: true,
      }),
      transformations: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(10, WINDOW),
        analytics: true,
      }),
    },
    // Starter: 480 minutes (8 hours), 50 transformations
    starter: {
      minutes: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(480, WINDOW),
        analytics: true,
      }),
      transformations: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(50, WINDOW),
        analytics: true,
      }),
    },
    // Pro: 1500 minutes (25 hours), unlimited transformations
    pro: {
      minutes: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(1500, WINDOW),
        analytics: true,
      }),
      transformations: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(10000, WINDOW), // Very high limit for "unlimited"
        analytics: true,
      }),
    },
  };
};

const rateLimiters = createRateLimiters();

// Get user subscription info from database with auto-sync
async function getUserSubscription(userId: string) {
  const prisma = new PrismaClient();
  try {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        lastSyncedAt: true,
        clerkPlanId: true,
      },
    });

    // If user doesn't exist or hasn't been synced recently, sync with Clerk
    const needsSync = !user || 
      !user.lastSyncedAt || 
      (new Date().getTime() - user.lastSyncedAt.getTime()) > 5 * 60 * 1000; // 5 minutes

    if (needsSync) {
      console.log('User needs sync, syncing with Clerk...', userId);
      const syncedUser = await syncUserWithDatabase(userId);
      user = {
        subscriptionTier: syncedUser.subscriptionTier,
        subscriptionStatus: syncedUser.subscriptionStatus,
        subscriptionEndsAt: syncedUser.subscriptionEndsAt,
        lastSyncedAt: syncedUser.lastSyncedAt,
        clerkPlanId: syncedUser.clerkPlanId,
      };
    }

    return {
      tier: user?.subscriptionTier || 'free',
      status: user?.subscriptionStatus || 'active',
    };
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    // Default to free plan if there's an error
    return {
      tier: 'free',
      status: 'active',
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Determine which rate limiter to use based on subscription
function getRateLimiterKey(subscription: { tier: string; status: string }) {
  if (!subscription.status || subscription.status !== 'active') {
    return 'free';
  }
  
  switch (subscription.tier) {
    case 'starter':
      return 'starter';
    case 'pro':
      return 'pro';
    case 'free':
    case 'trial':
    default:
      return 'free';
  }
}

export async function limitMinutes(userId: string, minutesToDecrease: number) {
  // Get user subscription info from database (with auto-sync)
  const subscription = await getUserSubscription(userId);
  const planLimits = CLERK_PLAN_LIMITS[subscription.tier as keyof typeof CLERK_PLAN_LIMITS];
  
  // Default to 5 minutes for free users
  const defaultMinutes = planLimits?.minutesLimit || 5;
  
  // For local development or if Redis/rate limiters are not available
  if (isLocal || !redis || !rateLimiters) {
    return {
      success: true,
      remaining: defaultMinutes,
      limit: defaultMinutes,
    };
  }

  try {
    const limiterKey = getRateLimiterKey(subscription);
    const limiter = rateLimiters[limiterKey]?.minutes;
    
    if (!limiter) {
      console.warn('Rate limiter not found for key:', limiterKey);
      return {
        success: true,
        remaining: defaultMinutes,
        limit: defaultMinutes,
      };
    }

    // Use multiple calls to simulate cost-based limiting
    let success = true;
    let remaining = 0;
    let limit = 0;
    let reset = 0;
    
    for (let i = 0; i < minutesToDecrease; i++) {
      const result = await limiter.limit(userId);
      if (!result.success) {
        success = false;
      }
      remaining = result.remaining;
      limit = result.limit;
      reset = result.reset;
    }
    
    return {
      success,
      remaining,
      limit,
      reset,
    };
  } catch (error) {
    console.error('Error in limitMinutes:', error);
    // Fallback to default limits if Redis fails
    return {
      success: true,
      remaining: defaultMinutes,
      limit: defaultMinutes,
    };
  }
}

export async function limitTransformations(userId: string) {
  // Get user subscription info from database (with auto-sync)
  const subscription = await getUserSubscription(userId);
  const planLimits = CLERK_PLAN_LIMITS[subscription.tier as keyof typeof CLERK_PLAN_LIMITS];
  
  // Pro plan has unlimited transformations
  if (subscription.tier === 'pro') {
    return {
      success: true,
      remaining: null, // null indicates unlimited
      limit: null,
    };
  }
  
  // Default to 10 transformations for free users
  const defaultTransformations = planLimits?.transformationsLimit || 10;
  
  // For local development, use in-memory counter
  if (isLocal || !redis || !rateLimiters) {
    const now = Date.now();
    const counter = localUsageCounters.get(userId) || { transformations: 0, minutes: 0, lastReset: now };
    
    // Reset counter if it's a new day
    if (now - counter.lastReset > DAY_IN_MS) {
      counter.transformations = 0;
      counter.minutes = 0;
      counter.lastReset = now;
    }
    
    if (counter.transformations >= defaultTransformations) {
      return {
        success: false,
        remaining: 0,
        limit: defaultTransformations,
      };
    }
    
    counter.transformations += 1;
    localUsageCounters.set(userId, counter);
    
    return {
      success: true,
      remaining: defaultTransformations - counter.transformations,
      limit: defaultTransformations,
    };
  }

  try {
    const limiterKey = getRateLimiterKey(subscription);
    const limiter = rateLimiters[limiterKey]?.transformations;
    
    if (!limiter) {
      console.warn('Rate limiter not found for key:', limiterKey);
      return {
        success: true,
        remaining: defaultTransformations,
        limit: defaultTransformations,
      };
    }

    const result = await limiter.limit(userId);
    
    return {
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Error in limitTransformations:', error);
    // Fallback to default limits if Redis fails
    return {
      success: true,
      remaining: defaultTransformations,
      limit: defaultTransformations,
    };
  }
}

export async function getMinutesLeft(userId: string) {
  // Get user subscription info from database (with auto-sync)
  const subscription = await getUserSubscription(userId);
  const planLimits = CLERK_PLAN_LIMITS[subscription.tier as keyof typeof CLERK_PLAN_LIMITS];
  
  const defaultMinutes = planLimits?.minutesLimit || 5;
  
  // For local development or if Redis/rate limiters are not available
  if (isLocal || !redis || !rateLimiters) {
    return {
      remaining: defaultMinutes,
      limit: defaultMinutes,
    };
  }

  try {
    const limiterKey = getRateLimiterKey(subscription);
    const limiter = rateLimiters[limiterKey]?.minutes;
    
    if (!limiter) {
      console.warn('Rate limiter not found for key:', limiterKey);
      return {
        remaining: defaultMinutes,
        limit: defaultMinutes,
      };
    }

    // Check current usage with the rate limiter
    const result = await limiter.getRemaining(userId);
    
    return {
      remaining: result,
      limit: defaultMinutes,
    };
  } catch (error) {
    console.error('Error in getMinutesLeft:', error);
    // Fallback to default limits if Redis fails
    return {
      remaining: defaultMinutes,
      limit: defaultMinutes,
    };
  }
}

export async function getTransformationsLeft(userId: string) {
  // Get user subscription info from database (with auto-sync)
  const subscription = await getUserSubscription(userId);
  const planLimits = CLERK_PLAN_LIMITS[subscription.tier as keyof typeof CLERK_PLAN_LIMITS];
  
  // Pro plan has unlimited transformations
  if (subscription.tier === 'pro') {
    return {
      remaining: null, // null indicates unlimited
      limit: null,
    };
  }
  
  const defaultTransformations = planLimits?.transformationsLimit || 10;
  
  // For local development, use in-memory counter
  if (isLocal || !redis || !rateLimiters) {
    const now = Date.now();
    const counter = localUsageCounters.get(userId) || { transformations: 0, minutes: 0, lastReset: now };
    
    // Reset counter if it's a new day
    if (now - counter.lastReset > DAY_IN_MS) {
      counter.transformations = 0;
      counter.minutes = 0;
      counter.lastReset = now;
    }
    
    return {
      remaining: Math.max(0, defaultTransformations - counter.transformations),
      limit: defaultTransformations,
    };
  }

  try {
    const limiterKey = getRateLimiterKey(subscription);
    const limiter = rateLimiters[limiterKey]?.transformations;
    
    if (!limiter) {
      console.warn('Rate limiter not found for key:', limiterKey);
      return {
        remaining: defaultTransformations,
        limit: defaultTransformations,
      };
    }

    // Check current usage with the rate limiter
    const result = await limiter.getRemaining(userId);
    
    return {
      remaining: result,
      limit: defaultTransformations,
    };
  } catch (error) {
    console.error('Error in getTransformationsLeft:', error);
    // Fallback to default limits if Redis fails
    return {
      remaining: defaultTransformations,
      limit: defaultTransformations,
    };
  }
}
