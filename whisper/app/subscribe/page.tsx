"use client";

import { PricingPage } from "@/components/PricingPage";

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Achieve the full power of AI-powered transcription and transformation
          </p>
        </div>
        
        <PricingPage />
      </div>
    </div>
  );
} 