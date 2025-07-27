import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { clerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { getPlanLimits, hasActiveSubscription } from "./revenuecat";

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
    // Free trial: 5 minutes, 0 transformations
    trial: {
      minutes: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(5, WINDOW),
        analytics: true,
      }),
      transformations: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(0, WINDOW),
        analytics: true,
      }),
    },
    // Starter: 120 minutes, 50 transformations
    starter: {
      minutes: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(120, WINDOW),
        analytics: true,
      }),
      transformations: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(50, WINDOW),
        analytics: true,
      }),
    },
    // Pro: 120 minutes, unlimited transformations
    pro: {
      minutes: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(120, WINDOW),
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

// Get user subscription info from database
async function getUserSubscription(userId: string) {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Determine which rate limiter to use based on subscription
function getRateLimiterKey(user: { subscriptionTier?: string | null; subscriptionStatus?: string | null }) {
  if (!hasActiveSubscription(user.subscriptionStatus || null)) {
    return 'trial';
  }
  
  switch (user.subscriptionTier) {
    case 'starter':
      return 'starter';
    case 'pro':
      return 'pro';
    default:
      return 'trial';
  }
}

export async function limitMinutes(userId: string, minutesToDecrease: number) {
  // Get user subscription info
  const user = await getUserSubscription(userId);
  const planLimits = getPlanLimits(user?.subscriptionTier || null);
  
  // For local development, still respect plan limits
  if (isLocal || !redis || !rateLimiters) {
    return {
      success: true,
      remaining: planLimits.minutesLimit || 5, // Default to 5 minutes for trial
      limit: planLimits.minutesLimit || 5,
    };
  }

  const limiterKey = getRateLimiterKey(user || {});
  const limiter = rateLimiters[limiterKey].minutes;
  
  // Use multiple calls to simulate cost-based limiting
  let success = true;
  let remaining = 0;
  let limit = 0;
  
  for (let i = 0; i < minutesToDecrease; i++) {
    const result = await limiter.limit(`minutes_${userId}`);
    if (!result.success) {
      success = false;
    }
    remaining = result.remaining;
    limit = result.limit;
  }
  
  return {
    success,
    remaining,
    limit,
  };
}

export async function limitTransformations(userId: string) {
  // Get user subscription info
  const user = await getUserSubscription(userId);
  const planLimits = getPlanLimits(user?.subscriptionTier || null);
  
  // For local development, use in-memory counter
  if (isLocal || !redis || !rateLimiters) {
    const now = Date.now();
    const userCounter = localUsageCounters.get(userId);
    
    // Reset counter if it's been more than a day
    if (!userCounter || (now - userCounter.lastReset) > DAY_IN_MS) {
      localUsageCounters.set(userId, { transformations: 0, minutes: 0, lastReset: now });
    }
    
    const currentUsage = localUsageCounters.get(userId)!;
    const limit = planLimits.transformationsLimit || 0;
    const remaining = limit === null ? 999999 : Math.max(0, limit - currentUsage.transformations);
    const success = limit === null || remaining > 0;
    
    // Increment usage if successful
    if (success && limit !== null) {
      currentUsage.transformations++;
    }
    
    return {
      success,
      remaining,
      limit,
    };
  }

  const limiterKey = getRateLimiterKey(user || {});
  const limiter = rateLimiters[limiterKey].transformations;
  
  const result = await limiter.limit(`transformations_${userId}`);
  
  return {
    success: result.success,
    remaining: result.remaining,
    limit: result.limit,
  };
}

// Get remaining limits without decrementing
export async function getMinutesLeft(userId: string) {
  const user = await getUserSubscription(userId);
  const planLimits = getPlanLimits(user?.subscriptionTier || null);
  
  if (isLocal || !redis || !rateLimiters) {
    return {
      remaining: planLimits.minutesLimit || 5, // Default to 5 minutes for trial
      limit: planLimits.minutesLimit || 5,
    };
  }

  const limiterKey = getRateLimiterKey(user || {});
  const limiter = rateLimiters[limiterKey].minutes;
  
  // Get remaining without decrementing by checking the current state
  try {
    const result = await limiter.getRemaining(`minutes_${userId}`);
    return {
      remaining: result,
      limit: planLimits.minutesLimit || 5,
    };
  } catch (error) {
    return {
      remaining: planLimits.minutesLimit || 5,
      limit: planLimits.minutesLimit || 5,
    };
  }
}

export async function getTransformationsLeft(userId: string) {
  const user = await getUserSubscription(userId);
  const planLimits = getPlanLimits(user?.subscriptionTier || null);
  
  if (isLocal || !redis || !rateLimiters) {
    const now = Date.now();
    const userCounter = localUsageCounters.get(userId);
    
    // Reset counter if it's been more than a day
    if (!userCounter || (now - userCounter.lastReset) > DAY_IN_MS) {
      localUsageCounters.set(userId, { transformations: 0, minutes: 0, lastReset: now });
    }
    
    const currentUsage = localUsageCounters.get(userId)!;
    const limit = planLimits.transformationsLimit || 0;
    const remaining = limit === null ? 999999 : Math.max(0, limit - currentUsage.transformations);
    
    return {
      remaining,
      limit,
    };
  }

  const limiterKey = getRateLimiterKey(user || {});
  const limiter = rateLimiters[limiterKey].transformations;
  
  // Get remaining without decrementing by checking the current state
  try {
    const result = await limiter.getRemaining(`transformations_${userId}`);
    return {
      remaining: result,
      limit: planLimits.transformationsLimit || 0,
    };
  } catch (error) {
    return {
      remaining: planLimits.transformationsLimit || 0,
      limit: planLimits.transformationsLimit || 0,
    };
  }
}
