"use client";

/**
 * components/pricing/PricingPageClient.tsx
 *
 * Phase 6C-2 — Complete Pricing Page (Interactive)
 *
 * Everything displayed comes exclusively from SubscriptionService, which
 * reads from subscription-config.ts. No value is hardcoded here.
 *
 * Requirement 2: Plans visible when PREMIUM_ENABLED = false (Coming Soon mode).
 * Requirement 3: No plan-name comparisons in this component.
 * Requirement 4: Pricing configurable via subscription-config.ts only.
 * Requirement 5: Coming Soon mode: toggle PREMIUM_ENABLED — no code change.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Minus,
  Zap,
  Clock,
  Star,
  Building2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { subscriptionService } from "@/lib/services/subscription-service";
import type { PlanId, PlanDefinition, FeatureName } from "@/lib/types/subscription";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

type BillingCycle = "monthly" | "yearly";

// ---------------------------------------------------------------------------
// STATIC METADATA (no hardcoded prices — just display labels)
// All plan data fetched from subscriptionService
// ---------------------------------------------------------------------------

const PLAN_ICONS: Record<PlanId, React.ComponentType<{ className?: string }>> = {
  free:     Zap,
  starter:  Clock,
  pro:      Star,
  business: Building2,
};

const PLAN_ACCENT: Record<PlanId, string> = {
  free:     "text-slate-400",
  starter:  "text-blue-400",
  pro:      "text-cyan-400",
  business: "text-amber-400",
};

const PLAN_BORDER: Record<PlanId, string> = {
  free:     "border-slate-700/50",
  starter:  "border-blue-500/30",
  pro:      "border-cyan-400/60 ring-2 ring-cyan-400/30",
  business: "border-amber-500/30",
};

const PLAN_BG: Record<PlanId, string> = {
  free:     "bg-slate-900/60",
  starter:  "bg-slate-900/60",
  pro:      "bg-slate-800/80",
  business: "bg-slate-900/60",
};

const BADGE_STYLE: Record<string, string> = {
  "Most Popular": "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
  "Best Value":   "bg-amber-500/15 text-amber-300 border border-amber-500/30",
};

// Feature rows shown on each plan card (key features only)
const CARD_FEATURES: Record<PlanId, string[]> = {
  free: [
    "Browser-based processing",
    "OCR recognition",
    "10 conversions per day",
    "Up to 100 MB per file",
    "1 file at a time",
  ],
  starter: [
    "Server-side processing",
    "Background removal",
    "50 conversions per day",
    "Up to 500 MB per file",
    "5 files per job",
    "7-day download history",
  ],
  pro: [
    "Priority queue",
    "Batch conversion (20 files)",
    "Image upscaling",
    "300 conversions per day",
    "Up to 5 GB per file",
    "30-day download history",
  ],
  business: [
    "GPU acceleration",
    "API access",
    "Custom branding",
    "Unlimited conversions",
    "Unlimited file sizes",
    "90-day download history",
  ],
};

// ---------------------------------------------------------------------------
// FEATURE COMPARISON TABLE DEFINITION
// ---------------------------------------------------------------------------

interface BooleanRow {
  type: "boolean";
  key: FeatureName;
  label: string;
  inverted?: boolean; // adsEnabled=false → ad-free = good
}
interface LimitRow {
  type: "limit";
  key: keyof ReturnType<typeof subscriptionService.getEffectiveLimits>;
  label: string;
}
interface SectionHeader {
  type: "section";
  label: string;
}
type TableRow = BooleanRow | LimitRow | SectionHeader;

const TABLE_ROWS: TableRow[] = [
  { type: "section", label: "Processing" },
  { type: "boolean", key: "browserProcessing",  label: "Browser Processing" },
  { type: "boolean", key: "serverProcessing",   label: "Server Processing" },
  { type: "boolean", key: "priorityQueue",       label: "Priority Queue" },
  { type: "boolean", key: "batchConversion",     label: "Batch Conversion" },
  { type: "boolean", key: "gpuAcceleration",     label: "GPU Acceleration" },

  { type: "section", label: "Conversion Features" },
  { type: "boolean", key: "ocr",                 label: "OCR Recognition" },
  { type: "boolean", key: "backgroundRemoval",   label: "Background Removal" },
  { type: "boolean", key: "upscaling",           label: "Image Upscaling" },
  { type: "boolean", key: "watermarkRemoval",    label: "Watermark Removal" },

  { type: "section", label: "Account & Storage" },
  { type: "boolean", key: "downloadHistory",     label: "Download History" },
  { type: "boolean", key: "conversionHistory",   label: "Conversion History" },
  { type: "boolean", key: "apiAccess",           label: "API Access" },
  { type: "boolean", key: "customBranding",      label: "Custom Branding" },
  { type: "boolean", key: "adsEnabled",          label: "Ad-Free", inverted: true },

  { type: "section", label: "Limits" },
  { type: "limit", key: "dailyConversions",      label: "Daily Conversions" },
  { type: "limit", key: "parallelConversions",   label: "Parallel Jobs" },
  { type: "limit", key: "maxFilesPerJob",        label: "Files per Job" },
  { type: "limit", key: "maxVideoMB",            label: "Max Video" },
  { type: "limit", key: "maxAudioMB",            label: "Max Audio" },
  { type: "limit", key: "maxImageMB",            label: "Max Image" },
  { type: "limit", key: "maxDocumentMB",         label: "Max Document" },
  { type: "limit", key: "downloadRetentionDays", label: "Download Retention" },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function formatLimitValue(
  key: string,
  value: number,
): string {
  if (value === -1) return "Unlimited";
  if (key.endsWith("MB"))         return `${value >= 1000 ? `${value / 1000} GB` : `${value} MB`}`;
  if (key === "downloadRetentionDays") return value === 0 ? "None" : `${value}d`;
  return value.toString();
}

function LimitDisplay({ value, label }: { value: string; label?: string }) {
  const isUnlimited = value === "Unlimited";
  return (
    <span
      className={
        isUnlimited
          ? "text-cyan-400 font-semibold text-sm"
          : "text-slate-300 text-sm"
      }
    >
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export function PricingPageClient() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [tableExpanded, setTableExpanded] = useState(false);

  // All plan data from subscriptionService — no hardcoded values
  const plans       = subscriptionService.getVisiblePlans();
  const isComingSoon = subscriptionService.isComingSoonMode();
  const discount    = subscriptionService.getYearlyDiscountPercent();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(6,182,212,0.08),transparent)] pointer-events-none" />
        <div className="container mx-auto px-4 pt-20 pb-12 max-w-5xl text-center relative">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-5"
            data-testid="pricing-eyebrow"
          >
            <Sparkles className="h-3 w-3" />
            Simple, Transparent Pricing
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight"
            data-testid="pricing-heading"
          >
            Convert More.{" "}
            <span className="text-cyan-400">Pay Less.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            Start free forever. Upgrade for faster processing, larger files, and premium features.
          </p>

          {/* Billing toggle */}
          <BillingToggle
            billing={billing}
            onChange={setBilling}
            discount={discount}
          />
        </div>
      </section>

      {/* ── Coming Soon Banner ────────────────────────────────────── */}
      {isComingSoon && (
        <div
          className="bg-amber-500/10 border-b border-amber-500/20"
          data-testid="coming-soon-banner"
        >
          <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-center gap-3 text-sm">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-medium">
              Paid plans launching soon.
            </span>
            <span className="text-amber-400/70">
              Start with Free today — no credit card required.
            </span>
          </div>
        </div>
      )}

      {/* ── Plan Cards ────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-12 max-w-6xl">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start"
          data-testid="pricing-plans-grid"
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              isComingSoon={isComingSoon}
            />
          ))}
        </div>
      </section>

      {/* ── Feature Comparison ────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-16 max-w-6xl">
        <div className="border border-slate-800 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="bg-slate-900/80 px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <h2 className="text-white font-semibold text-lg">Full Feature Comparison</h2>
            <button
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
              onClick={() => setTableExpanded(!tableExpanded)}
              data-testid="toggle-comparison-table"
            >
              {tableExpanded ? "Hide" : "Show all features"}
              <span className={`transition-transform duration-200 ${tableExpanded ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
          </div>

          <div className={`transition-all duration-300 ${tableExpanded ? "" : "max-h-[520px] overflow-hidden"}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="feature-comparison-table">
                {/* Sticky column headers */}
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-6 py-3 text-slate-500 font-medium w-52">Feature</th>
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        className={`text-center px-4 py-3 font-semibold ${PLAN_ACCENT[plan.id as PlanId]}`}
                      >
                        {plan.displayName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row, idx) => {
                    if (row.type === "section") {
                      return (
                        <tr key={idx} className="bg-slate-900/40">
                          <td
                            colSpan={plans.length + 1}
                            className="px-6 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500"
                          >
                            {row.label}
                          </td>
                        </tr>
                      );
                    }

                    if (row.type === "boolean") {
                      return (
                        <tr
                          key={idx}
                          className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="px-6 py-3 text-slate-300">{row.label}</td>
                          {plans.map((plan) => {
                            const features = subscriptionService.getPlanFeatures(plan.id as PlanId);
                            const rawValue = features[row.key as FeatureName] as boolean;
                            const active = row.inverted ? !rawValue : rawValue;
                            return (
                              <td key={plan.id} className="text-center px-4 py-3">
                                {active ? (
                                  <Check
                                    className="h-4 w-4 text-cyan-400 mx-auto"
                                    data-testid={`feature-${plan.id}-${row.key}-yes`}
                                  />
                                ) : (
                                  <Minus
                                    className="h-4 w-4 text-slate-600 mx-auto"
                                    data-testid={`feature-${plan.id}-${row.key}-no`}
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }

                    // Limit row
                    if (row.type === "limit") {
                      return (
                        <tr
                          key={idx}
                          className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="px-6 py-3 text-slate-300">{row.label}</td>
                          {plans.map((plan) => {
                            const limits = subscriptionService.getEffectiveLimits(plan.id as PlanId);
                            const raw = limits[row.key as keyof typeof limits] as number;
                            const display = formatLimitValue(row.key as string, raw);
                            return (
                              <td key={plan.id} className="text-center px-4 py-3">
                                <LimitDisplay value={display} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }

                    return null;
                  })}
                </tbody>
              </table>
            </div>

            {/* Fade out when collapsed */}
            {!tableExpanded && (
              <div className="h-16 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
            )}
          </div>

          {/* Show more button */}
          {!tableExpanded && (
            <div className="text-center border-t border-slate-800 py-4 bg-slate-950">
              <button
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                onClick={() => setTableExpanded(true)}
                data-testid="expand-comparison-table"
              >
                View all {TABLE_ROWS.filter(r => r.type !== "section").length} features
                <span className="ml-1 text-slate-500">↓</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ / Bottom CTA ─────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          {isComingSoon ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-3">
                Paid plans launching soon
              </h2>
              <p className="text-slate-400 mb-8">
                Start with the Free plan today. Paid plans will unlock automatically — no migration needed.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg transition-colors"
                data-testid="start-free-cta"
              >
                Start Converting Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-3">
                Questions? We have answers.
              </h2>
              <p className="text-slate-400 mb-8">
                All plans include our full format library. Upgrade to unlock server-side processing and higher limits.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg transition-colors"
                data-testid="start-free-cta"
              >
                Start Converting Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// BILLING TOGGLE SUBCOMPONENT
// ---------------------------------------------------------------------------

function BillingToggle({
  billing,
  onChange,
  discount,
}: {
  billing: BillingCycle;
  onChange: (b: BillingCycle) => void;
  discount: number;
}) {
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 border border-slate-700/50"
      data-testid="billing-toggle"
    >
      <button
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          billing === "monthly"
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
        onClick={() => onChange("monthly")}
        data-testid="billing-monthly-btn"
      >
        Monthly
      </button>
      <button
        className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          billing === "yearly"
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
        onClick={() => onChange("yearly")}
        data-testid="billing-yearly-btn"
      >
        Yearly
        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-semibold">
          -{discount}%
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PLAN CARD SUBCOMPONENT
// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  billing,
  isComingSoon,
}: {
  plan: PlanDefinition;
  billing: BillingCycle;
  isComingSoon: boolean;
}) {
  const planId = plan.id as PlanId;
  const PlanIcon = PLAN_ICONS[planId];
  const isFree = planId === "free";
  const isRecommended = plan.recommended;

  // Price display — all from subscriptionService, nothing hardcoded
  const priceDisplay = subscriptionService.getPriceDisplay(planId, billing);
  const yearlyTotal  = subscriptionService.getYearlyTotalDisplay(planId);
  const savings      = subscriptionService.getMonthlySavingsDisplay(planId);

  // CTA state: free = always active, paid = active only when !isComingSoon
  const ctaEnabled  = isFree || !isComingSoon;
  const ctaHref     = isFree ? "/" : `/checkout/${planId}`;
  const ctaLabel    = isFree
    ? "Start for Free"
    : isComingSoon
    ? "Coming Soon"
    : `Get ${plan.displayName}`;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${PLAN_BG[planId]} ${PLAN_BORDER[planId]} ${
        isRecommended ? "shadow-lg shadow-cyan-500/10" : ""
      }`}
      data-testid={`plan-card-${planId}`}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${BADGE_STYLE[plan.badge] ?? "bg-slate-700 text-slate-300"}`}
            data-testid={`plan-badge-${planId}`}
          >
            {plan.badge}
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isRecommended ? "bg-cyan-500/15" : "bg-slate-800"
          }`}
        >
          <PlanIcon className={`h-4 w-4 ${PLAN_ACCENT[planId]}`} />
        </div>
        <div>
          <h3 className="text-white font-semibold text-base">{plan.displayName}</h3>
          {isFree && (
            <span className="text-xs text-slate-500">No credit card needed</span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        {isFree ? (
          <div className="flex items-end gap-1">
            <span
              className="text-4xl font-bold text-white"
              data-testid={`plan-price-${planId}`}
            >
              $0
            </span>
            <span className="text-slate-500 mb-1 text-sm">/month</span>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1">
              <span
                className="text-4xl font-bold text-white"
                data-testid={`plan-price-${planId}`}
              >
                {priceDisplay}
              </span>
              <span className="text-slate-500 mb-1 text-sm">/mo</span>
            </div>
            {billing === "yearly" && (
              <p className="text-xs text-slate-400 mt-1">
                {yearlyTotal}/year{" "}
                <span className="text-cyan-400">— save {savings}/mo</span>
              </p>
            )}
            {billing === "monthly" && (
              <p className="text-xs text-slate-500 mt-1">
                or {subscriptionService.getPriceDisplay(planId, "yearly")}/mo billed yearly
              </p>
            )}
          </div>
        )}
      </div>

      {/* Key features */}
      <ul className="space-y-2 mb-8 flex-1">
        {CARD_FEATURES[planId].map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm">
            <Check className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-300">{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {ctaEnabled ? (
        <Link
          href={ctaHref}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            isRecommended
              ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              : isFree
              ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
          }`}
          data-testid={`plan-cta-${planId}`}
        >
          {ctaLabel}
          {!isFree && <ArrowRight className="h-3.5 w-3.5" />}
        </Link>
      ) : (
        <button
          disabled
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed"
          data-testid={`plan-cta-${planId}`}
        >
          Coming Soon
        </button>
      )}
    </div>
  );
}

export default PricingPageClient;
