// RevenueCat Web (Stripe) configuration
export const REVENUECAT_PUBLIC_KEY = process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY!;

// Subscription plans for Stripe integration
export const PLANS = {
  starter: {
    id: 'starter',
    name: 'starter',
    displayName: 'Starter',
    priceMonthly: 8.99,
    transformationsLimit: 50, // 50 transformations per day
    minutesLimit: 120, // 120 minutes per month
    revenueCatIdentifier: 'prod_Sk2SntebFrm1zd', // Stripe Product ID for Starter
    entitlementId: 'starter_access', // RevenueCat entitlement identifier
  },
  pro: {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro', 
    priceMonthly: 12.99,
    transformationsLimit: null, // unlimited transformations
    minutesLimit: 120, // 120 minutes per month
    revenueCatIdentifier: 'prod_Sk2SLG8sxYESsm', // Stripe Product ID for Pro
    entitlementId: 'pro_access', // RevenueCat entitlement identifier
  },
} as const;

export type PlanType = keyof typeof PLANS;

// Web-specific configuration validation
export function validateRevenueCatConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check if API key is configured and looks like a web/Stripe key
  if (!REVENUECAT_PUBLIC_KEY || REVENUECAT_PUBLIC_KEY === 'your_revenuecat_public_key') {
    issues.push('NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY is not configured in your .env file');
  } else if (!REVENUECAT_PUBLIC_KEY.startsWith('strp_')) {
    issues.push('API key should start with "strp_" for Stripe/Web integration');
  }

  // Check if Stripe product identifiers are configured
  Object.entries(PLANS).forEach(([key, plan]) => {
    if (!plan.revenueCatIdentifier || !plan.revenueCatIdentifier.startsWith('prod_')) {
      issues.push(`Plan ${key} has invalid Stripe product ID: ${plan.revenueCatIdentifier} (should start with "prod_")`);
    }

    if (!plan.entitlementId || !plan.entitlementId.includes('access')) {
      issues.push(`Plan ${key} has invalid entitlement ID: ${plan.entitlementId}`);
    }
  });

  return {
    valid: issues.length === 0,
    issues
  };
}

// Get plan limits based on subscription status
export function getPlanLimits(subscriptionTier: string | null) {
  if (!subscriptionTier || subscriptionTier === 'none') {
    return {
      transformationsLimit: 0, // Trial users get 0 transformations
      minutesLimit: 5, // Trial users get 5 minutes
    };
  }

  const plan = PLANS[subscriptionTier as PlanType];
  if (!plan) {
    return {
      transformationsLimit: 0,
      minutesLimit: 5,
    };
  }

  return {
    transformationsLimit: plan.transformationsLimit,
    minutesLimit: plan.minutesLimit,
  };
}

// Check if user has active subscription
export function hasActiveSubscription(subscriptionStatus: string | null): boolean {
  return subscriptionStatus === 'active';
}

// Get user's current entitlements (what they have access to)
export function getUserEntitlements(subscriptionTier: string | null): string[] {
  if (!subscriptionTier || subscriptionTier === 'none') {
    return []; // No entitlements for trial users
  }

  const plan = PLANS[subscriptionTier as PlanType];
  return plan ? [plan.entitlementId] : [];
}

// Subscription status interface for web
export interface SubscriptionStatus {
  plan: PlanType | null;
  isActive: boolean;
  expirationDate: string | null;
  paymentMethod?: 'stripe' | null;
} 