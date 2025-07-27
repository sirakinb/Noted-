"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface UpgradeButtonProps {
  currentPlan: string;
  targetPlan: string;
  targetPlanName: string;
}

export function UpgradeButton({ currentPlan, targetPlan, targetPlanName }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (currentPlan === targetPlan) {
      alert(`You're already on the ${targetPlanName} plan!`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPlanId: targetPlan }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully upgraded to ${targetPlanName}!`);
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to upgrade subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isLoading || currentPlan === targetPlan}
      className="w-full"
    >
      {isLoading ? 'Upgrading...' : currentPlan === targetPlan ? 'Current Plan' : `Upgrade to ${targetPlanName}`}
    </Button>
  );
} 