import Stripe from 'stripe';

// Stripe configuration
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-06-30.basil',
    })
  : null;

export const STRIPE_PUBLISHABLE_KEY = stripePublishableKey;

// Stripe plans configuration
export const STRIPE_PLANS = {
  starter: {
    displayName: 'Starter',
    priceMonthly: 8.99,
    transformationsLimit: 50,
    minutesLimit: '8 hours of transcription per month',
    audioHoursLimit: 8, // 8 hours = 480 minutes
    maxFileSize: '100 MB per file',
    maxFileDuration: '2 hours per file',
    prioritySupport: false,
    stripeProductId: 'prod_Sk2SntebFrm1zd',
    stripePriceId: 'price_1RoYNGCHgVkAnNskkc2FjgJ4',
  },
  pro: {
    displayName: 'Pro',
    priceMonthly: 12.99,
    transformationsLimit: null, // Unlimited
    minutesLimit: '25 hours of transcription per month',
    audioHoursLimit: 25, // 25 hours = 1500 minutes
    maxFileSize: '200 MB per file',
    maxFileDuration: '4 hours per file',
    prioritySupport: true,
    stripeProductId: 'prod_Sk2SLG8sxYESsm',
    stripePriceId: 'price_1RoYNzCHgVkAnNsk95tvmzxQ',
  },
} as const;

export type StripePlanType = keyof typeof STRIPE_PLANS;

// Validate Stripe configuration
export function validateStripeConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!stripeSecretKey) {
    issues.push('STRIPE_SECRET_KEY is not configured in your .env file');
  }

  if (!stripePublishableKey) {
    issues.push('STRIPE_PUBLISHABLE_KEY is not configured in your .env file');
  }

  return {
    valid: issues.length === 0,
    issues
  };
} 