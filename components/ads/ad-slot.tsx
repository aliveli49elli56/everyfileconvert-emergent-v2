"use client";

/**
 * components/ads/ad-slot.tsx
 *
 * Phase 6C-2 — Subscription-Aware Ad Slot
 *
 * Requirement 1: Advertisement visibility controlled exclusively through
 * SubscriptionService.shouldShowAds(). No plan-name comparisons here.
 *
 * Usage:
 *   <AdSlot planId="free" adUnit="sidebar-1" height={250} width={300} />
 *
 * When PREMIUM_ENABLED = true and user upgrades, pass their planId and
 * ads automatically disappear — no UI changes needed.
 */

import { useEffect, useRef } from "react";
import { subscriptionService } from "@/lib/services/subscription-service";
import { DEFAULT_PLAN_ID } from "@/lib/config/subscription-config";
import type { PlanId } from "@/lib/types/subscription";

interface AdSlotProps {
  adUnit: string;
  height: number;
  width: number;
  className?: string;
  /**
   * The user's current plan.
   * Requirement 1: determines adsEnabled via SubscriptionService only.
   * Defaults to DEFAULT_PLAN_ID ('free') until auth is available.
   */
  planId?: PlanId;
}

export default function AdSlot({
  adUnit,
  height,
  width,
  className = "",
  planId = DEFAULT_PLAN_ID,
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isProduction = process.env.NODE_ENV === "production";

  // Requirement 1: the ONLY check — no if (plan === 'pro') / if (isPremium)
  const adsEnabled = subscriptionService.shouldShowAds(planId);

  useEffect(() => {
    if (!adsEnabled) return;
    if (isProduction && adRef.current) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
          {}
        );
      } catch (error) {
        console.error("AdSense error:", error);
      }
    }
  }, [isProduction, adsEnabled]);

  // Requirement 1: return null when ads are disabled for this plan
  // Future: when user upgrades, simply pass the new planId — ads vanish
  if (!adsEnabled) return null;

  if (isProduction) {
    return (
      <ins
        ref={adRef}
        className={`adsbygoogle ${className}`}
        style={{
          display: "inline-block",
          width: `${width}px`,
          height: `${height}px`,
        }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={adUnit}
        data-ad-format="auto"
        data-full-width-responsive="false"
      />
    );
  }

  // Development placeholder
  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-slate-900/50 border border-dashed border-slate-700/50 rounded-lg overflow-hidden ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      data-testid={`ad-slot-${adUnit}`}
    >
      <p className="text-[10px] text-slate-500 tracking-widest uppercase font-medium">
        Ad Slot
      </p>
      <p className="text-[9px] text-slate-600 mt-1">{adUnit}</p>
      <p className="text-[9px] text-slate-700 mt-0.5">
        {width}×{height}
      </p>
    </div>
  );
}
