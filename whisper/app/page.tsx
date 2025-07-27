"use client";

import { LandingPage } from "@/components/landing-page";
import { UpgradeButton } from "@/components/UpgradeButton";

export default function Home() {
  return (
    <div>
      {/* Temporary test button - remove in production */}
      <div className="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
        <h3 className="text-sm font-semibold mb-2">Test Upgrade</h3>
        <UpgradeButton 
          currentPlan="starter" 
          targetPlan="pro" 
          targetPlanName="Pro" 
        />
      </div>
      <LandingPage />
    </div>
  );
}
