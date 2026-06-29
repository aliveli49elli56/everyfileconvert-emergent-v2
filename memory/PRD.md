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

## Prioritised Backlog

### P0 (Must have)
- ✅ robots.txt
- ✅ x-default hreflang on all pages
- ✅ Remove duplicate layout hreflang tags
- ✅ Dynamic metadata for about/contact/privacy/terms
- ✅ Fix canonical URL inconsistency (www vs no-www)

### P1 (Should have — Phase 4C candidates)
- Image sitemap (for image-specific SEO)
- Video sitemap entries
- Breadcrumb JSON-LD on category hub pages
- `noindex` for error/404 pages (blocked by `"use client"` in not-found.tsx)
- News/article sitemap if blog is added

### P2 (Nice to have)
- Logo ImageObject in Organization schema
- SoftwareApplication schema on tool hub pages
- Canonical handling for paginated content (if added)
- OpenGraph locale per-page (currently inherited from layout)
