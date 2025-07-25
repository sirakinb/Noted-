import { NextRequest } from "next/server";
import { validateRevenueCatConfig, PLANS } from "@/lib/revenuecat";

export async function GET(req: NextRequest) {
  try {
    const validation = validateRevenueCatConfig();
    
    const response = {
      timestamp: new Date().toISOString(),
      revenueCatConfig: {
        valid: validation.valid,
        issues: validation.issues,
        hasApiKey: !!process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY,
        apiKeyLength: process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY?.length || 0,
        plans: Object.entries(PLANS).map(([key, plan]) => ({
          key,
          displayName: plan.displayName,
          price: plan.priceMonthly,
          productId: plan.revenueCatIdentifier,
          entitlementId: plan.entitlementId,
        })),
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("RevenueCat debug error:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to validate RevenueCat configuration",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 