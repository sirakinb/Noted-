"use client";

import { PricingTable } from '@clerk/nextjs';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start with our free trial, then choose the plan that works best for you
          </p>
        </div>
        
        {/* Clerk's PricingTable component - handles checkout automatically */}
        <div className="max-w-4xl mx-auto">
          <PricingTable />
        </div>

        {/* Trial Info */}
        <div className="text-center mt-12 p-6 bg-gray-50 rounded-lg max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Trial</h3>
          <p className="text-gray-600 mb-4">
            Start with <strong>5 minutes of audio</strong> and <strong>10 AI transformations</strong> completely free!
          </p>
          <p className="text-sm text-gray-500">
            No credit card required. Upgrade anytime to unlock more features.
          </p>
        </div>
      </div>
    </div>
  );
} 