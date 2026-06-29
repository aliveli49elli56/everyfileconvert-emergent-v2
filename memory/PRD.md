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

## Updated Prioritised Backlog

### P0 — Complete
- ✅ robots.txt
- ✅ x-default hreflang on all pages
- ✅ Remove duplicate layout hreflang tags
- ✅ Dynamic metadata for about/contact/privacy/terms
- ✅ Fix canonical URL inconsistency (www vs no-www)
- ✅ 404/error page noindex
- ✅ Image sitemap
- ✅ BreadcrumbList JSON-LD on all category hub pages

### P1 — Remaining
- Add `noindex` to [locale]-scoped not-found (currently only root not-found covered)
- Image sitemap: Add per-format representative images if a `/public/format-icons/` directory is created
- News/article sitemap (if blog added)

### P2 — Future
- Organization schema `logo` ImageObject (once logo available at domain root)
- SoftwareApplication schema on tool hub pages
- Pagination/canonical handling for tool lists
