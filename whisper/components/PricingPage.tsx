"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { STRIPE_PLANS, type StripePlanType } from '@/lib/stripe';
import { useUser } from '@clerk/nextjs';

interface PricingPageProps {
  onPlanSelect?: (planType: StripePlanType) => void;
}

export function PricingPage({ onPlanSelect }: PricingPageProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planType: StripePlanType) => {
    if (!user) {
      alert('Please sign in first');
      return;
    }

    setIsLoading(planType);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: planType }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }

      onPlanSelect?.(planType);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {Object.entries(STRIPE_PLANS).map(([key, plan]) => {
          const isDisabled = isLoading === key;

          return (
            <div
              key={key}
              className="border rounded-lg p-8 hover:shadow-lg transition-shadow"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{plan.displayName}</h3>
                <div className="text-4xl font-bold mb-4">
                  ${plan.priceMonthly}
                  <span className="text-lg text-gray-500">/month</span>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">What you'll achieve:</h4>
                  <ul className="text-left space-y-3">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">✓</span>
                      <div>
                        <strong>{plan.minutesLimit}</strong>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">✓</span>
                      <div>
                        <strong>{plan.transformationsLimit 
                          ? `${plan.transformationsLimit} AI transformations per day`
                          : 'Unlimited AI transformations'
                        }</strong>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">✓</span>
                      <div>
                        <strong>Files up to {plan.maxFileSize || '100 MB'}</strong>
                      </div>
                    </li>
                    {plan.prioritySupport && (
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2 mt-1">✓</span>
                        <div>
                          <strong>Priority support</strong>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>

                <Button
                  onClick={() => handleSelectPlan(key as StripePlanType)}
                  disabled={isDisabled}
                  className="w-full"
                  size="lg"
                >
                  {isDisabled ? 'Loading...' : `Get ${plan.displayName}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Cancel anytime. No questions asked.</p>
      </div>
    </div>
  );
} 