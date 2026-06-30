# Phase 6C-2 — Pricing, Subscription UI & Advertisement Foundation
## Completion Report

**Date:** 2026-02-XX  
**Status:** COMPLETE  
**TypeScript:** 0 errors (`npx tsc --noEmit` exits 0)  
**Build:** PASS (`npm run build` exits 0)

---

## Executive Summary

Phase 6C-2 builds the complete Pricing and Subscription UI on top of the Phase 6C-1 foundation without refactoring any existing architecture. A new `SubscriptionService` facade provides the single interface for all UI component queries. A fully configurable Pricing page renders dynamically from `subscription-config.ts`. Advertisement visibility is now controlled by the subscription system. All 12 requirements have been implemented and validated.

---

## 1. Pricing Architecture

### Single Source of Truth
All pricing data comes exclusively from `lib/config/subscription-config.ts`:
- Monthly prices: FREE=$0, STARTER=$7.99, PRO=$14.99, BUSINESS=$29.99
- Yearly prices: STARTER=$6.39, PRO=$11.99, BUSINESS=$23.99
- Discount: 20% off monthly price when billed yearly
- `YEARLY_DISCOUNT_PERCENT = 20` (configurable)

### Pricing Helpers (in subscription-config.ts)
- `formatPrice(cents, currency)` → `'$14.99'`
- `getYearlyTotal(planId)` → yearly total in cents
- `getMonthlySavings(planId)` → per-month savings in cents

### No hardcoded prices anywhere
- `subscriptionService.getPriceDisplay(planId, billing)` → formatted price
- `subscriptionService.getYearlyTotalDisplay(planId)` → `'$143.88'`
- `subscriptionService.getMonthlySavingsDisplay(planId)` → `'$3.00'`

---

## 2. Subscription UI Architecture

### SubscriptionService (`lib/services/subscription-service.ts`)
The **only** interface UI components use. Facade over LimitEngine + PlanResolver + QuotaEngine.

Key methods:
| Method | Purpose |
|---|---|
| `canUseFeature(planId, feature)` | Boolean feature check |
| `getPlanFeatures(planId)` | Full PlanFeatures object |
| `getEffectiveLimits(planId)` | Full UsageLimits object |
| `shouldShowAds(planId)` | Ad visibility (Req 1) |
| `getPriceDisplay(planId, billing)` | Formatted price string |
| `getYearlyTotalDisplay(planId)` | Annual billing total |
| `getMonthlySavingsDisplay(planId)` | Yearly saving per month |
| `isComingSoonMode()` | PREMIUM_ENABLED flag |
| `isPlanPurchasable(planId)` | Purchase gate check |
| `getDownloadContext(planId)` | Download workflow data |
| `getStripePriceId(planId, billing)` | Phase 6C-3 hook |
| `getPaypalPlanId(planId, billing)` | Phase 6C-3 hook |
| `validateCoupon(code, planId)` | Phase 6C-3 hook |

### Pricing Page (`app/[locale]/pricing/page.tsx`)
Server component with generateStaticParams + generateMetadata for SEO. Renders `PricingPageClient`.

### Pricing Page Client (`components/pricing/PricingPageClient.tsx`)
Interactive client component. Key behaviors:
- Monthly/Yearly toggle (reads `YEARLY_DISCOUNT_PERCENT` from config)
- 4 plan cards from `subscriptionService.getVisiblePlans()` — not hardcoded
- Coming Soon banner when `subscriptionService.isComingSoonMode() = true`
- Free plan CTA always active; paid plan CTAs disabled in Coming Soon mode
- Full feature comparison table (18 feature rows + 8 limit rows across 26 data points)
- "Show all features" expand/collapse

---

## 3. Advertisement Architecture

### Requirement 1 Compliance
- `AdSlot` component now accepts `planId?: PlanId` prop
- **Only check**: `subscriptionService.shouldShowAds(planId)` → `adsEnabled` feature
- Returns `null` when `adsEnabled = false` — no rendering, no network request
- No `if (plan === 'pro')`, `if (premium)`, `if (isPremium)` anywhere

### How It Works
```
Page → AdSlot({ planId: 'free' })
     → subscriptionService.shouldShowAds('free')
     → limitEngine.canUseFeature('free', 'adsEnabled')
     → PLAN_DEFINITIONS.free.features.adsEnabled (= true)
     → Ad renders
```

When user upgrades (Phase 6C-3):
```
Page → AdSlot({ planId: 'pro' })
     → subscriptionService.shouldShowAds('pro')
     → PLAN_DEFINITIONS.pro.features.adsEnabled (= false)
     → Returns null — no ad
```

**No UI changes needed to enable/disable ads. Toggle only subscription-config.ts.**

---

## 4. Feature Matrix Audit

### New Field Added
- `downloadRetentionDays: number` added to `UsageLimits` in `lib/types/subscription.ts`
- Values: FREE=0, STARTER=7, PRO=30, BUSINESS=90

### Complete Feature Matrix Coverage
All 15+ features from Requirement 2 are now in the matrix:
| Feature | Type | FREE | STARTER | PRO | BUSINESS |
|---|---|---|---|---|---|
| adsEnabled | boolean | true | false | false | false |
| downloadHistory | boolean | false | true | true | true |
| conversionHistory | boolean | false | true | true | true |
| priorityQueue | boolean | false | false | true | true |
| batchConversion | boolean | false | false | true | true |
| apiAccess | boolean | false | false | false | true |
| browserProcessing | boolean | true | true | true | true |
| serverProcessing | boolean | false | true | true | true |
| gpuAcceleration | boolean | false | false | false | true |
| ocr | boolean | true | true | true | true |
| backgroundRemoval | boolean | false | true | true | true |
| watermarkRemoval | boolean | false | false | true | true |
| upscaling | boolean | false | false | true | true |
| customBranding | boolean | false | false | false | true |
| history | boolean | false | true | true | true |
| parallelConversions | limit | 1 | 3 | 10 | 50 |
| maxParallelJobs (alias) | limit | 1 | 3 | 10 | 50 |
| maxUploadImageMB | limit | 50 | 200 | 1000 | 5000 |
| maxUploadVideoMB | limit | 100 | 500 | 5000 | ∞ |
| maxUploadAudioMB | limit | 100 | 200 | 1000 | 5000 |
| maxUploadDocumentMB | limit | 50 | 200 | 1000 | 5000 |
| maxUploadArchiveMB | limit | 100 | 500 | 5000 | ∞ |
| maxDailyConversions | limit | 10 | 50 | 300 | ∞ |
| downloadRetentionDays | limit | 0 | 7 | 30 | 90 |

---

## 5. Configuration Audit

### Duplicates Removed from `future-services.ts`
- `UsageLimits` interface → removed, now imports `SubscriptionUsageLimits` from subscription.ts
- `PremiumPlan` → marked `@deprecated`, will use `PlanDefinition` (Phase 6D cleanup)
- `AdSlot` → renamed to `AdSlotConfig` to avoid collision; `premiumDisabled` removed
- `AdConfig.enabled` → marked `@deprecated`; `IAdsEngine.shouldShowAd()` now documented to route through SubscriptionService

### Configuration Checklist
| Item | Single Source? |
|---|---|
| Prices | ✅ subscription-config.ts only |
| Yearly prices | ✅ subscription-config.ts only |
| Currencies | ✅ subscription-config.ts only |
| Daily limits | ✅ subscription-config.ts only |
| Upload limits | ✅ subscription-config.ts only |
| Feature availability | ✅ subscription-config.ts only |
| Badges | ✅ subscription-config.ts only |
| Labels (displayName) | ✅ subscription-config.ts only |
| Plan visibility | ✅ subscription-config.ts only |
| Recommended plan | ✅ subscription-config.ts only |
| Premium enable/disable | ✅ FEATURE_FLAGS.PREMIUM_ENABLED only |
| Advertisement control | ✅ adsEnabled feature flag only |

---

## 6. Pricing Configuration (Current)

To change any pricing detail, edit ONLY `lib/config/subscription-config.ts`:

```typescript
// Update monthly prices:
monthlyPriceCents: 799   // $7.99  (STARTER)
monthlyPriceCents: 1499  // $14.99 (PRO)
monthlyPriceCents: 2999  // $29.99 (BUSINESS)

// Update yearly prices:
yearlyPriceCents: 639    // $6.39/mo (STARTER)
yearlyPriceCents: 1199   // $11.99/mo (PRO)
yearlyPriceCents: 2399   // $23.99/mo (BUSINESS)

// Change discount: (auto-updates toggle badge)
export const YEARLY_DISCOUNT_PERCENT = 20;

// Change recommended plan:
recommended: true  // set on desired plan

// Change badge text:
badge: 'Most Popular'  // or any string

// Toggle pricing page visibility:
SHOW_PRICING_PAGE: true

// Toggle coming soon mode:
PREMIUM_ENABLED: false → true  // activates purchasing
```

---

## 7. Future Billing Readiness

### Stripe Integration (Phase 6C-3)
```typescript
// subscriptionService already exposes the hook:
getStripePriceId(planId, billing)
// Phase 6C-3: return process.env[`STRIPE_PRICE_${planId.toUpperCase()}_${billing}`]
```

### PayPal Integration (Phase 6C-3)
```typescript
getPaypalPlanId(planId, billing)
// Phase 6C-3: return from config/environment
```

### Authentication Integration (Phase 6C-3)
```typescript
// PlanResolver._resolvePlanId() is the only change needed:
private _resolvePlanId(userId) {
  return session?.user?.planId ?? DEFAULT_PLAN_ID;
}
```

### Coupon / Promotional Pricing (Phase 6C-3)
```typescript
validateCoupon(code, planId)
// Phase 6C-3: validate against Stripe/PayPal coupon APIs
```

### Regional Pricing (Phase 6C-3)
- `PlanDefinition.currency` field already supports any ISO currency code
- `formatPrice(cents, currency)` uses `Intl.NumberFormat` for locale-aware formatting
- Regional price overrides: add `regionalPrices: Record<string, number>` to PlanDefinition

### VAT & Invoice (Phase 6C-3)
- Stripe Tax handles VAT automatically when billing is implemented
- Invoice generation via Stripe's built-in invoice system

---

## 8. Download Workflow Readiness

### `lib/types/download-workflow.ts` Created
Contains interfaces for Phase 6C-3 `/download` page:
- `ConversionSummary` — metadata emitted by conversion providers
- `DownloadPageContext` — everything /download page needs (no processor queries)
- `DownloadReadyEvent` — event fired when conversion completes (for redirect)
- `DownloadHistoryEntry` — persisted download record (Phase 6C-3)
- `IDownloadWorkflowManager` — interface for Phase 6C-3 implementation
- `AdRefreshContext` — ad targeting data for download page

### Provider Redirect Pattern (Phase 6C-3)
```typescript
// Providers will emit this event on completion:
const event: DownloadReadyEvent = {
  type: 'download:ready',
  jobId: uuid(),
  summary: { ...conversionData },
  downloadUrl: URL.createObjectURL(blob),
  blob,
};
// /download page subscribes to this → no provider changes needed
```

---

## 9. Provider Integration Verification

All providers verified to not contain plan-specific logic:
- `lib/providers/` — verified: no `FREE/STARTER/PRO/BUSINESS` plan name references
- `lib/engine/provider-selection-engine.ts` — uses `limitEngine.canUseFeature(planId, 'serverProcessing')`
- `lib/file-validation.ts` — uses `limitEngine.checkFileSizeAllowed()`
- `components/ads/ad-slot.tsx` — uses `subscriptionService.shouldShowAds(planId)`

---

## 10. Configuration Audit Summary

✅ No duplicated limits (future-services.ts UsageLimits removed)  
✅ No duplicated pricing (future-services.ts PremiumPlan deprecated)  
✅ No duplicated feature flags (FEATURE_FLAGS is the only source)  
✅ No duplicated advertisement logic (IAdsEngine.shouldShowAd documented to route through SubscriptionService)  
✅ No duplicated plan metadata  

---

## 11. Remaining Work Before Authentication

1. Replace `PlanResolver._resolvePlanId()` stub with JWT session lookup
2. Pass real `planId` to `AdSlot` component from user session
3. Add `planId` to user session object (JWT payload)
4. Update `SubscriptionService.getCurrentPlan()` to use auth session

---

## 12. Remaining Work Before Payment Integration

1. Configure Stripe Price IDs in environment variables
2. Implement `getStripePriceId()` in SubscriptionService
3. Build checkout flow (`/checkout/[planId]`) — calls Stripe Checkout Sessions API
4. Build subscription management flow (cancel, upgrade, downgrade)
5. Build webhook handler (`/api/stripe/webhook`) to update user plan in DB

---

## 13. Remaining Work Before Phase 6D

- `/download` page implementation (ConversionSummary → DownloadPageContext)
- DownloadWorkflowManager implementation (IDownloadWorkflowManager)
- Download history persistence (per-user DB records)
- QuotaEngine Redis backing (replace in-memory store)
- Server-side providers Docker environment (FFmpeg, LibreOffice, Ghostscript)

---

## Validation

```bash
npx tsc --noEmit   # Exit 0 — zero TypeScript errors
npm run build      # Exit 0 — production build successful
```

Pricing page verified: http://localhost:3000/en/pricing
- Plans render from subscriptionService
- Prices from subscription-config.ts only
- Coming Soon mode active (PREMIUM_ENABLED = false)
- Feature comparison table shows all 26 data points
- Navbar "Pricing" link visible (SHOW_PRICING_PAGE = true)
