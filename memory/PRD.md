# EveryFileConvert — Product Requirements Document

## Original Problem Statement
Phase 4B: Production-ready SEO layer on top of existing repository.
Repository-aware implementation. No redesign of converters, upload flow, FFmpeg, or business logic.
Preserve UI, layouts, routing, i18n architecture, and all existing components.

## Architecture (Existing)
- **Framework**: Next.js App Router (TypeScript)
- **Routing**: `app/[locale]/` dynamic segment + `app/[locale]/[slug]/` + `app/[locale]/[...slug]/`
- **i18n**: 17 locales (en, tr, de, fr, es, it, pt, ja, zh, nl, pl, ko, sv, da, no, hu, fi)
- **Deployment**: Netlify + @netlify/plugin-nextjs
- **Styling**: Tailwind CSS
- **Canonical domain**: `https://everyfileconvert.com` (no-www, standardised in Phase 4B)

## Phase 4B — Completed (SEO Layer)

### Implemented 2025-02-XX

#### Core SEO Infrastructure
- **`/app/app/robots.ts`** (NEW) — Next.js App Router robots.txt generator; disallows `/_next/`, `/api/`; points to sitemap
- **`/app/lib/i18n/config.ts`** — `getHreflangLinks()` now returns `x-default` entry automatically; return type broadened to `{ locale: string; href: string }[]`
- **`/app/app/sitemap.ts`** — Standardised `BASE_URL` to `https://everyfileconvert.com` (removed www inconsistency)

#### Layout / Global SEO
- **`/app/app/[locale]/layout.tsx`**
  - Removed duplicate manual `<link rel="alternate">` hreflang tags from `<head>` (these were injecting root-path hreflangs on every page — wrong signal for non-root pages)
  - Fixed `metadataBase` to `https://everyfileconvert.com`
  - Fixed OG image URL (was a broken pexels URL path)
  - Added global `robots: { index: true, follow: true, googleBot: ... }`
  - Injected **Organization JSON-LD** schema site-wide
  - Added `title.template: '%s | EveryFileConvert'` for consistent title branding

#### Homepage
- **`/app/app/[locale]/page.tsx`**
  - Added explicit `robots` directive
  - Injected **WebSite + SearchAction JSON-LD** (Sitelinks Searchbox signal)

#### Info Pages (Static → Dynamic Metadata)
All four pages converted from `export const metadata` to `generateMetadata({ params })`:
- **about/page.tsx** — canonical, hreflang (17 langs + x-default), robots index, `generateStaticParams`
- **contact/page.tsx** — same
- **privacy/page.tsx** — same
- **terms/page.tsx** — same
- **ebook-converter/page.tsx** — converted + full OG/Twitter added

#### Viewer Pages
- **`view/page.tsx`** — Added `getHreflangLinks`, full OpenGraph, Twitter, `robots`, canonical (no-www fix)
- **`view/[slug]/page.tsx`** — Fixed canonical (www → no-www); added `robots`; added full **BreadcrumbList + WebPage + HowTo + FAQPage JSON-LD** (3 FAQ pairs + 4 HowTo steps)

#### Conversion Pages
- **`[slug]/page.tsx`** — Added `robots`; expanded FAQPage from 1 Q&A to **3 Q&As** for both single-format and conversion pairs; added **BreadcrumbList** JSON-LD
- **`[...slug]/page.tsx`** — Same: `robots`, 3-Q&A FAQPage, BreadcrumbList

#### Tool Pages
- **`tools/[...toolPath]/page.tsx`** — Added `robots`; added **BreadcrumbList JSON-LD** (Home → Parent Category → Tool)

#### Category Hub Pages (robots added to all)
- `image-converter`, `video-converter`, `audio-converter`, `pdf-tools`
- `image-resizer`, `background-remover`, `compress-audio`, `image-crop`

### Schema Types Implemented
| Schema | Pages |
|---|---|
| Organization | All pages (layout) |
| WebSite + SearchAction | Homepage |
| BreadcrumbList | [slug], [...slug], view/[slug], tools/[...toolPath] |
| SoftwareApplication | [slug], [...slug] |
| FAQPage (3 Q&As) | [slug], [...slug], view/[slug] |
| HowTo + HowToStep | view/[slug] |
| WebPage | [slug], [...slug], view/[slug] |

### Metadata Coverage (Post Phase 4B)
Every indexable page now exposes: `title`, `description`, `canonical`, `robots`, `openGraph`, `twitter`, `alternates.languages` (17 locales + x-default), `keywords`

### Phase 4B Completion — Tasks Added (Post Phase 4B Initial)

#### Task 1 — 404 / Error Page SEO
- **`/app/app/not-found.tsx`** — Removed `"use client"` (no hooks present, Button/Link are server-component safe); exported `metadata` with `title: '404 — Page Not Found | EveryFileConvert'` and `robots: { index: false, follow: false }`; UI unchanged.

#### Task 2 — Image Sitemap
- **`/app/app/image-sitemap.xml/route.ts`** (NEW) — Next.js App Router route handler that generates a fully spec-compliant Google Image Sitemap XML. Covers 16 image format families × (1 single-format page + N conversion pages) × 17 locales. Includes `<image:loc>`, `<image:title>`, `<image:caption>` per entry. Cached 24 hours.
- **`/app/app/robots.ts`** — Updated `sitemap` to `string[]` listing both `sitemap/0.xml` and `image-sitemap.xml`.

#### Task 3 — Breadcrumb JSON-LD for Category Pages
BreadcrumbList JSON-LD added to 9 category hub pages:

| Page | Breadcrumb Hierarchy |
|---|---|
| image-converter | Home → Image Converter |
| video-converter | Home → Video Converter |
| audio-converter | Home → Audio Converter |
| pdf-tools | Home → PDF & Document Tools |
| ebook-converter | Home → Ebook Converter |
| image-resizer | Home → Image Converter → Image Resizer |
| background-remover | Home → Image Converter → Background Remover |
| image-crop | Home → Image Converter → Image Cropper |
| compress-audio | Home → Audio Converter → Audio Compressor |

Logical hierarchy (3-level for tools, 2-level for hub pages) reflects the navigation structure.

## Phase 5B — Performance Optimization (Completed)

### Task 1 — Bundle & Import Optimization
- **`app/[locale]/HomeClient.tsx`**: `FormatSelector` (255-line interactive component, below-the-fold) converted from eager static import to `dynamic(() => import(...), { ssr: false })` with pulse skeleton. Homepage route-specific bundle: **8.32 kB → 7.11 kB** (−14.5%).
- **`next.config.js`**: Added `experimental.optimizePackageImports: ['lucide-react']` — 97 unique icon imports across the codebase now benefit from Next.js 13.5's barrel-file tree-shaker.

### Task 3 — Next.js / Import Correctness
- **`components/viewer/FileViewer.tsx`**: Moved `import dynamic from "next/dynamic"` from line 33 (after 12 `dynamic()` calls) to the top of the file — correct import order per ES module spec and Next.js conventions.

### Validated No-Change Items
- **Task 2 (Re-renders)**: No confirmed unnecessary re-renders. Page-level components render once; interactive converter components already use `useCallback`/`useRef` correctly.
- **Task 4 (Images)**: `images: { unoptimized: true }` is required by COEP headers for SharedArrayBuffer/FFmpeg.wasm. User-uploaded images are blob URLs — cannot use `next/image`. No change required.
- **Task 5 (Code Splitting)**: `FileViewer.tsx` already lazy-loads all 12 viewer sub-components. Conversion tool eagerly loaded (it IS the primary feature).
- **Task 6 (Data fetching)**: App is 100% browser-side processing — no API calls to optimize.

### Build Metrics
| Metric | Before | After | Delta |
|---|---|---|---|
| `/[locale]` route chunk | 8.32 kB | 7.11 kB | −1.21 kB (−14.5%) |
| `/[locale]` First Load JS | 118 kB | 116 kB | −2 kB |
| Shared chunks | 80.9 kB | 80.9 kB | unchanged |
| Build status | PASS | PASS | ✅ |



### Task 1 & 2 — TypeScript
- **Status: CLEAN** — `npx tsc --noEmit` exits 0 with no output.
- The previously-observed HomeClient.tsx warnings were only visible during incremental compilation in the previous session; the full project type-check is clean.

### Task 3 — ESLint
Fixed 3 files with `react/no-unescaped-entities` errors (introduced by Phase 4B):
- `app/not-found.tsx` — `you're` → `you&apos;re`, `doesn't` → `doesn&apos;t`
- `app/[locale]/privacy/page.tsx` — `else's` → `else&apos;s`, opening/closing `"` → `&quot;`, `browser's` → `browser&apos;s`
- `app/[locale]/terms/page.tsx` — `"Service"` → `&quot;Service&quot;`, `"as is"` / `"as available"` → `&quot;`, `device's` → `device&apos;s`
- `lib/i18n/config.ts` — Removed invalid `// eslint-disable-next-line @typescript-eslint/no-require-imports` comment (plugin not installed, comment caused the error itself)

All remaining ESLint output is pre-existing **Warnings** only (in untouched converter components) — zero Errors.

### Task 4 — Production Build
- **Status: PASS** — `npm run build` succeeds. BUILD_ID generated. Only warning is pre-existing `node-fetch` optional `encoding` module (irrelevant to runtime).

### Task 5 — Runtime Stability
All routes return HTTP 200:
`/`, `/en`, `/en/png-to-jpg`, `/en/image-converter`, `/en/pdf-tools`, `/en/ebook-converter`, `/en/about`, `/en/privacy`, `/en/terms`, `/en/view`, `/en/view/pdf`, `/en/tools/image-cropper`, `/tr/png-to-jpg`, `/robots.txt`, `/image-sitemap.xml`

### Task 6 — Safe Code Cleanup
- Removed unused eslint-disable comment in `lib/i18n/config.ts`
- No unused imports found in Phase 4B-modified files


### P0 — Complete
- ✅ robots.txt
- ✅ x-default hreflang on all pages
- ✅ Remove duplicate layout hreflang tags
- ✅ Dynamic metadata for about/contact/privacy/terms
- ✅ Fix canonical URL inconsistency (www vs no-www)
- ✅ 404/error page noindex
- ✅ Image sitemap
- ✅ BreadcrumbList JSON-LD on all category hub pages

### P1 — Remaining (SEO)
- Add `noindex` to [locale]-scoped not-found (currently only root not-found covered)
- Image sitemap: Add per-format representative images if a `/public/format-icons/` directory is created
- News/article sitemap (if blog added)

### P2 — Future (SEO)
- Organization schema `logo` ImageObject (once logo available at domain root)
- SoftwareApplication schema on tool hub pages
- Pagination/canonical handling for tool lists

---

## Phase 5C — Production Hardening & Runtime Safety Lock (Completed)

### Implemented Feb 2026

#### P0 — Error Boundaries (3 files created)

| File | Role | Notes |
|---|---|---|
| `app/error.tsx` | Root error boundary | Catches crashes in non-locale routes |
| `app/[locale]/error.tsx` | Locale error boundary | Catches crashes in all page routes (most critical) |
| `app/global-error.tsx` | Global error boundary | Catches root layout crashes; includes `<html><body>` per Next.js spec; uses inline styles for maximum resilience |

All three boundaries:
- `"use client"` directive
- Accept `error: Error & { digest?: string }` and `reset: () => void` props
- Log errors via `useEffect(() => { console.error(error) }, [error])`
- Display safe fallback UI matching the existing design system (light gradient background, "Try again" + "Back to Home" buttons)
- No new dependencies introduced

#### P1 — Hydration Safety Audit (All Clear — No changes required)

| File | Issue Checked | Result |
|---|---|---|
| `AdvancedStudio.tsx` | `document.createElement` in `handleDownload` | Safe: inside click handler only, never during SSR render |
| `navbar.tsx` | `window.addEventListener` | Safe: inside `useEffect` with cleanup |
| `ViewHistory.tsx` | `window.dispatchEvent` calls | Safe: all guarded with `typeof window === "undefined"` |
| `EbookConverter.tsx` | `window.innerWidth` access | Safe: inside `processFile` callback (user interaction only) |
| `UniversalConverter.tsx` | `targetEntry` null risk | Safe: guarded with `{targetEntry && ...}` conditional rendering |

#### P2 — fetch/API Safety (Not applicable)
App is 100% in-browser processing — no server fetch calls in any route.

### Build Validation
- **`npm run build`**: ✅ PASS — 9,636 static pages generated, exit 0
- **`npx tsc --noEmit`**: ✅ PASS — zero type errors
- **Runtime routes**: All routes return HTTP 200 after supervisor restart

### Phase 5C Completion Status
- ✅ Error boundaries active on all routes (root, locale, global)
- ✅ Zero hydration warnings introduced
- ✅ No UI changes made
- ✅ No broken routes
- ✅ Build passes cleanly
