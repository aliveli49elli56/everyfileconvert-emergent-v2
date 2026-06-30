# Phase 6C-1 — Subscription Foundation & Configurable Limit Engine
## Completion Report

**Date:** 2026-02-XX  
**Status:** COMPLETE  
**TypeScript:** 0 errors (`npx tsc --noEmit` exits 0)  
**Build:** PASS (`npm run build` exits 0)

---

## Summary

Phase 6C-1 establishes the complete subscription architecture foundation for EveryFileConvert.  
All pricing, limits, feature flags, and plan capabilities now have a single source of truth.  
No limit value, plan name, or feature flag is hardcoded anywhere in the application.

---

## Files Created / Modified

### New Files

| File | Role |
|---|---|
| `lib/types/subscription.ts` | Canonical TypeScript types for the entire subscription system |
| `lib/config/subscription-config.ts` | **Single source of truth** — plans, limits, features, flags, helpers |
| `lib/engine/limit-engine.ts` | Centralized runtime Limit Engine (all 7 requirements) |
| `lib/engine/quota-engine.ts` | In-memory QuotaEngine stub (IQuotaProvider) |
| `lib/engine/plan-resolver.ts` | PlanResolver stub (ISubscriptionProvider) — always FREE in 6C-1 |

### Modified Files

| File | Change |
|---|---|
| `lib/engine/subscription-hooks.ts` | Wired to new engines; backward-compat stubs retained |
| `lib/engine/provider-selection-engine.ts` | LimitEngine integrated; `userPlanId` added; `getMaximumUploadSize()` added |
| `lib/file-validation.ts` | Hardcoded `FILE_SIZE_LIMIT` removed; delegates to LimitEngine |

---

## Requirement Compliance Matrix

### Req 1 — Audio Limits
- `maxAudioMB` defined per plan in `subscription-config.ts` (FREE: 100, STARTER: 200, PRO: 1000, BUSINESS: 5000)
- `CATEGORY_LIMIT_MAP['audio'] = 'maxAudioMB'` in config
- `limitEngine.getMaxUploadMBByExtension('free', 'mp3')` resolves: `mp3 → audio → maxAudioMB → 100`
- `limitEngine.getMaxUploadMBByExtension('free', 'wav')` resolves: `wav → audio → maxAudioMB → 100`
- **No hardcoded audio limits anywhere in the codebase**
- Status: ✅ COMPLETE

### Req 2 — Premium Visibility
- `PREMIUM_ENABLED = false` does NOT hide plans — it only disables purchasing
- `limitEngine.isPlanVisible(planId)` reads `plan.visible` only (independent of PREMIUM_ENABLED)
- `limitEngine.isPlanPurchasable(planId)` returns `false` when `PREMIUM_ENABLED = false`
- `limitEngine.isComingSoonMode()` returns `!FEATURE_FLAGS.PREMIUM_ENABLED`
- `limitEngine.getVisiblePlans()` returns all visible plans regardless of PREMIUM_ENABLED
- Coming Soon mode: toggle `PREMIUM_ENABLED = true` in subscription-config.ts — no code change needed
- Status: ✅ COMPLETE

### Req 3 — Single Source of Truth
- All prices (monthly/yearly), currencies, daily limits, upload limits, feature availability,
  badges, labels, plan visibility, recommended plan, and premium enable/disable live
  **exclusively** in `/lib/config/subscription-config.ts`
- No other application file requires modification to change any of these values
- Admin guide embedded at top of subscription-config.ts
- Status: ✅ COMPLETE

### Req 4 — Download Workflow Preparation
- `limitEngine.getDownloadContext(planId)` returns everything the /download page needs:
  - `planDefinition` — full plan details
  - `workflow` — DownloadWorkflow descriptor (watermark, queue, size limit)
  - `hasDownloadHistory` — from `plan.features.downloadHistory`
  - `hasConversionHistory` — from `plan.features.conversionHistory`
  - `upgradeEligibility` — `{ eligible, nextPlan }`
  - `maxFilesPerJob` — from plan limits
  - `dailyLimit` — from plan limits
  - `isPurchasable` — respects PREMIUM_ENABLED flag
  - `isComingSoon` — coming-soon mode flag
- The /download page never needs to query processors for subscription info
- Status: ✅ COMPLETE

### Req 5 — Processor Isolation
- `limitEngine.canUseProcessor(planId, processorId)` is the **only** path for processor checks
- `PROCESSOR_FEATURE_REQUIREMENTS` maps 80+ processor IDs to required PlanFeatures
- No processor may reference 'free', 'starter', 'pro', or 'business' by name
- No processor contains plan-specific limits
- `provider-selection-engine.ts` calls `limitEngine.canUseFeature(planId, 'serverProcessing')`
  instead of hardcoded `requiresPremium && userTier === 'free'` check
- Status: ✅ COMPLETE

### Req 6 — Fully Configurable Daily Limits
- `FREE_LIMITS.dailyConversions = 10` — change to any value in subscription-config.ts only
- `limitEngine.getDailyLimit(planId)` reads the value at runtime
- `quotaEngine.canConvert()` enforces via LimitEngine (no hardcoded thresholds)
- Changing to 5 / 20 / 50 / 100 / -1 (unlimited) requires ONLY subscription-config.ts edit
- Status: ✅ COMPLETE

### Req 7 — Category-Based Upload Limits
- `limitEngine.getMaxUploadMBByExtension(planId, ext)`:
  - `ext` → `formatRegistry.get(ext).category` (Format Registry is source of truth)
  - `category` → `CATEGORY_LIMIT_MAP[category]` → `UsageLimits key`
  - `limits[key]` → MB value from subscription-config.ts
- Example resolutions:
  - `png` → `image` → `maxImageMB` → 50 (FREE)
  - `mp3` → `audio` → `maxAudioMB` → 100 (FREE)
  - `mp4` → `video` → `maxVideoMB` → 100 (FREE)
  - `docx` → `document` → `maxDocumentMB` → 50 (FREE)
  - `pdf` → `pdf` → `maxPdfMB` → 50 (FREE)
  - `zip` → `archive` → `maxArchiveMB` → 100 (FREE)
- `file-validation.ts` exposes `validateFileSizeByExtension(file, planId, ext)` using this chain
- `provider-selection-engine.ts` exposes `getMaximumUploadSizeByExtension(planId, ext)`
- Status: ✅ COMPLETE

---

## Plan Configuration Summary

| Plan | Price/mo | Daily Conversions | Parallel | Files/Job | Max Video | Max Audio |
|---|---|---|---|---|---|---|
| Free | $0 | 10 | 1 | 1 | 100 MB | 100 MB |
| Starter | $9.99 | 50 | 3 | 5 | 500 MB | 200 MB |
| Pro | $24.99 | 300 | 10 | 20 | 5,000 MB | 1,000 MB |
| Business | $79.99 | Unlimited | 50 | 100 | Unlimited | 5,000 MB |

---

## Feature Matrix Summary

| Feature | Free | Starter | Pro | Business |
|---|---|---|---|---|
| Browser Processing | ✅ | ✅ | ✅ | ✅ |
| Server Processing | ❌ | ✅ | ✅ | ✅ |
| Priority Queue | ❌ | ❌ | ✅ | ✅ |
| Batch Conversion | ❌ | ❌ | ✅ | ✅ |
| GPU Acceleration | ❌ | ❌ | ❌ | ✅ |
| OCR | ✅ | ✅ | ✅ | ✅ |
| Background Removal | ❌ | ✅ | ✅ | ✅ |
| Upscaling | ❌ | ❌ | ✅ | ✅ |
| Watermark Removal | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |
| Download History | ❌ | ✅ | ✅ | ✅ |
| Ads | ✅ | ✅ | ❌ | ❌ |

---

## Architecture Interfaces Implemented

| Interface | Location | Implementation |
|---|---|---|
| `ILimitProvider` | `lib/types/subscription.ts` | `LimitEngine` |
| `IQuotaProvider` | `lib/types/subscription.ts` | `QuotaEngine` (stub) |
| `ISubscriptionProvider` | `lib/types/subscription.ts` | `PlanResolver` (stub) |
| `IUsageTracker` | `lib/types/subscription.ts` | (merged into QuotaEngine) |
| `IDownloadWorkflowProvider` | `lib/types/subscription.ts` | `LimitEngine.getDownloadWorkflow()` |
| `IDownloadHistoryProvider` | `lib/types/subscription.ts` | Phase 6C-2 |
| `IDownloadPermissionProvider` | `lib/types/subscription.ts` | Phase 6C-2 |

---

## Extension Points for Phase 6C-2

### PlanResolver (auth integration)
```typescript
// Replace _resolvePlanId() in plan-resolver.ts:
private async _resolvePlanId(userId: string | null): Promise<PlanId> {
  const session = await getServerSession(); // Phase 6C-2: JWT session
  return session?.user?.planId ?? DEFAULT_PLAN_ID;
}
```

### QuotaEngine (Redis integration)
```typescript
// Replace _getOrCreate() with Redis:
async recordConversion(userId: string | null, bytes: number): Promise<void> {
  const key = `quota:${userId ?? 'anon'}:${todayUTC()}`;
  await redis.incr(key);
  await redis.expire(key, 86400); // 24h window
}
```

### LimitEngine.getDownloadWorkflow() (watermarking)
```typescript
// Phase 6C-2: implement per-plan watermark logic
getDownloadWorkflow(planId: PlanId): DownloadWorkflow {
  return {
    permitted:          true,
    applyWatermark:     planId === 'free',       // Watermark on free tier
    maxOutputSizeBytes: planId === 'free' ? 50 * 1024 * 1024 : 0,
    useAsyncQueue:      planId !== 'business',
  };
}
```

---

## Processor Feature Requirements Coverage

Total processor IDs registered in `PROCESSOR_FEATURE_REQUIREMENTS`: **80+**

Categories covered:
- Image (basic + premium: background-remove, upscale, watermark-remove)
- RAW, Vector, Video, Audio, PDF, OCR
- Document, Spreadsheet, Presentation
- Ebook, Archive, Font, GIS, Webpage
- Subtitle, Certificate, 3D, CAD
- Email, Code, Scientific, Medical, Disk
- Batch, API

---

## What Phase 6C-2 Must NOT Do

- ❌ Add any limit value outside subscription-config.ts
- ❌ Hardcode plan names (FREE/STARTER/PRO/BUSINESS) in processors
- ❌ Add extension-based size checks (use Format Registry category chain)
- ❌ Duplicate IUsageTracker / ILimitProvider implementations
- ❌ Reference `FEATURE_FLAGS` outside limitEngine.isAppFeatureEnabled()

---

## Validation

```bash
npx tsc --noEmit   # Exit 0 — zero TypeScript errors
npm run build      # Exit 0 — production build successful
```
