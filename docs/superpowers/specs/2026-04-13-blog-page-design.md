# Blog Page & External Publishing API — Design Spec

**Date:** 2026-04-13
**Project:** `apps/marketing` (Easy Micro SaaS)
**Status:** Approved — implementing directly

## Purpose

Add a public-facing blog to the marketing site **and** the external publishing API that the central dashboard uses to push AI-generated articles into it. The API must match the contract the dashboard already expects — field names and response shapes are wire-locked and cannot be altered.

## Decisions Summary

| Decision | Choice |
|---|---|
| Scope | Full stack — 6 API endpoints + public blog UI + nav/footer links |
| Categories | 15 seeded via migration, stored in `blog_categories` table |
| Tags | 50 seeded in `blog_tags` table; `/metadata/tags` returns union of seeded + actually-used tags |
| Tag storage on articles | Postgres `TEXT[]` array column (idiomatic, supports future filtering) |
| Image storage | Supabase Storage bucket `blog-media` + `next.config.ts` rewrite so URLs appear as `/uploads/*` |
| Site context endpoint | 5 groups: target-audience, content-themes, brand-voice, product-context, avoid |
| Public blog pages | `/blog` index, `/blog/[slug]` article, `/blog/category/[slug]` |
| Blog link placement | Navbar + Footer |
| Delete behavior | Soft delete (`published = false`) |
| Author default | `"Easy Micro SaaS Team"` when not supplied |
| Auth | Single `x-api-key` header checked against `BLOG_PUBLISH_API_KEY` env var |

## Database Schema

New migration: `supabase/migrations/00025_blog_system.sql`

### `blog_categories`
```
slug        TEXT PRIMARY KEY
name        TEXT NOT NULL
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```
Seeded with 15 rows (see Category Seed below). RLS: public read, service-role write.

### `blog_tags`
```
slug        TEXT PRIMARY KEY
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```
Seeded with 50 rows (see Tag Seed below). This table exists **only** to provide the vocabulary baseline for `/metadata/tags`. Articles do NOT reference it via FK — tags on articles are stored as a `TEXT[]` array.

### `blog_articles`
```
id             UUID PRIMARY KEY DEFAULT gen_random_uuid()
slug           TEXT UNIQUE NOT NULL
title          TEXT NOT NULL
content        TEXT NOT NULL            -- HTML
excerpt        TEXT
category_slug  TEXT REFERENCES blog_categories(slug)
author         TEXT NOT NULL DEFAULT 'Easy Micro SaaS Team'
reading_time   INTEGER                  -- minutes
featured_image TEXT                     -- public URL
tags           TEXT[] NOT NULL DEFAULT '{}'
published      BOOLEAN NOT NULL DEFAULT true
published_at   TIMESTAMPTZ NOT NULL DEFAULT now()
created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
```
Index: `(published, published_at DESC)` for the index page listing. GIN index on `tags` for future tag filtering. RLS: public read *where `published = true`*, service-role write.

### Category Seed (15)
| Slug | Name |
|---|---|
| positioning | Positioning & Messaging |
| launch-strategies | Launch Strategies |
| pricing-monetization | Pricing & Monetization |
| growth-experiments | Growth Experiments |
| seo | SEO |
| content-marketing | Content Marketing |
| email-marketing | Email Marketing |
| social-media | Social Media |
| paid-ads | Paid Ads |
| customer-acquisition | Customer Acquisition |
| retention-churn | Retention & Churn |
| analytics-metrics | Analytics & Metrics |
| founder-stories | Founder Stories |
| tools-and-workflows | Tools & Workflows |
| ai-for-marketers | AI for Marketers |

### Tag Seed (50)
**Platforms (9):** twitter-x, linkedin, reddit, product-hunt, hacker-news, tiktok, youtube, indie-hackers, github
**SEO (5):** keyword-research, backlinks, technical-seo, programmatic-seo, copywriting
**Content Formats (5):** case-study, tutorial, teardown, listicle, comparison-post
**Acquisition Tactics (10):** cold-email, cold-dm, landing-page-optimization, conversion-rate, ab-testing, lead-magnets, referral-program, affiliate-marketing, partnerships, viral-loops
**Email (3):** newsletter, drip-campaign, onboarding-email
**Metrics (5):** attribution, funnel-analysis, cac, ltv, tracked-links
**Stage/Persona (6):** pre-launch, first-100-users, zero-to-one, bootstrapping, solo-founder, side-project
**Monetization (3):** freemium, pricing-strategy, upgrades
**Tools & Automation (4):** no-code, ai-tools, automation, crm

## API Endpoints

All under `app/api/publish/*`. Every route **must**:
1. Check `x-api-key` header against `BLOG_PUBLISH_API_KEY`. Return `401 { "error": "Unauthorized" }` on mismatch.
2. Use the existing Supabase service-role client pattern from `app/api/waitlist/route.ts`.

Shared helper: `lib/blog/auth.ts` exports `requireApiKey(request: Request): NextResponse | null` — returns a 401 response to bail, or `null` to continue.

### 1. `POST /api/publish/article` — Upsert article
**Required body fields:** `slug`, `title`, `content`
**Optional:** `excerpt`, `category`, `author`, `readingTime`, `featuredImage`, `tags` (comma-separated string), `published` (default `true`), `publishedAt` (ISO 8601, default now)

**Behavior:**
- Split `tags` on `,`, trim each, lowercase. Store as array.
- Validate `category` against `blog_categories` if provided. On miss, return `409 { "error": "Invalid category", "valid": ["slug1", "slug2", ...] }`.
- If slug exists → update. Else → insert.
- Update path sets `updated_at = now()`.

**Success:**
```json
{
  "success": true,
  "slug": "...",
  "publishedUrl": "https://easymicrosaas.com/blog/...",
  "created": true
}
```
`created` is `true` on insert, `false` on update.

**Errors:**
- `401` — bad API key
- `400` — missing required fields: `{ "error": "Missing required field: <name>" }`
- `409` — invalid category: `{ "error": "Invalid category", "valid": [...] }`

### 2. `DELETE /api/publish/article/:slug` — Soft delete
Sets `published = false` on the article with matching slug.

**Success:** `{ "success": true, "slug": "..." }`
**404:** `{ "error": "Article not found" }` (when no row matches)

### 3. `GET /api/publish/metadata/categories`
Returns all rows from `blog_categories`, ordered by name.
```json
{ "categories": [{ "slug": "...", "name": "..." }, ...] }
```

### 4. `GET /api/publish/metadata/tags`
Returns the **union** of seeded tags (from `blog_tags`) and distinct tags actually used across **published** articles.
```json
{ "tags": ["ab-testing", "affiliate-marketing", ...] }
```
Implementation: one query pulls seeded slugs, another pulls `SELECT DISTINCT unnest(tags) FROM blog_articles WHERE published = true`, then merge + dedupe + sort in the route handler.

### 5. `GET /api/publish/metadata/context`
Hardcoded in `lib/blog/context.ts`. Returns 5 groups:
```json
{
  "context": [
    {
      "label": "target-audience",
      "description": "The reader personas this site is written for. Blog content should resonate with these groups.",
      "items": [
        { "slug": "solo-founder", "name": "Solo Founder" },
        ...
      ]
    },
    ...
  ]
}
```
The 5 groups and their items are:
1. **target-audience** — solo-founder, indie-hacker, micro-saas-operator, bootstrapper, technical-founder, non-technical-founder, side-project-builder
2. **content-themes** — go-to-market, positioning, campaign-angles, avatar-targeting, tracked-links, ready-to-post-content, post-launch-marketing
3. **brand-voice** — direct, practical, no-fluff, founder-to-founder, slightly-casual, actionable
4. **product-context** — turns-brief-into-avatars, generates-campaign-angles, creates-ready-to-post-content, provides-tracked-links, measures-what-works
5. **avoid** — enterprise-sales, vc-fundraising, hiring-teams, crypto-web3, ai-hype-without-substance

### 6. `POST /api/publish/media` — Image upload
Accepts `multipart/form-data` with field name `image`. Writes to Supabase Storage bucket `blog-media` under a generated filename (format: `<timestamp>-<slugified-original>.<ext>`).

**Success:**
```json
{ "url": "https://easymicrosaas.com/uploads/<filename>" }
```
Note: the `/uploads/*` path is served via a `next.config.ts` rewrite that maps to the Supabase Storage public URL for the `blog-media` bucket. No Next.js function invocation on image reads.

**Errors:** `401` (auth), `400` (no image, unsupported mime type)

## Image Pipeline

1. Create Supabase Storage bucket `blog-media` (public read). Done via migration.
2. Upload in `/api/publish/media` route using service-role client.
3. `next.config.ts` rewrite:
   ```ts
   async rewrites() {
     return [
       {
         source: '/uploads/:filename*',
         destination: 'https://<project-ref>.supabase.co/storage/v1/object/public/blog-media/:filename*',
       },
     ];
   }
   ```
   Project ref read from `SUPABASE_URL` at build time.

## Public Blog UI

All pages match the existing dark Tailwind aesthetic (`bg-zinc-950`, indigo/violet accents, same `Navbar` + `Footer`).

### `app/blog/page.tsx` — Blog index
- Server component, fetches all published articles ordered by `published_at DESC`.
- Hero header: "Blog" title + short tagline.
- Grid of article cards (featured image, category chip, title, excerpt, author, reading time, published date).
- Each card links to `/blog/[slug]`.
- Footer CTA section reusing existing waitlist component.

### `app/blog/[slug]/page.tsx` — Article
- Server component, fetches one article by slug where `published = true`, `notFound()` otherwise.
- Header: category chip, title, author + published date + reading time row.
- Featured image (if present).
- Content rendered via `dangerouslySetInnerHTML` (the HTML is admin-supplied, trusted source).
- Tag chips at the bottom.
- "Back to blog" link.
- SEO meta: `generateMetadata()` returning title, description from excerpt, `og:image` from featured image, `article:author`, `article:published_time`.

### `app/blog/category/[slug]/page.tsx` — Category page
- Server component. Validates category exists via `blog_categories` (else `notFound()`).
- Header: category name + short description.
- Same article grid as the index, filtered to `category_slug = param`.

### Navigation
- Add "Blog" link to `components/navbar.tsx` — matches existing link styles.
- Add "Blog" link to `components/footer.tsx` — likely in a product/company column.

### Shared components
- `components/blog/article-card.tsx` — card used on index + category pages
- `components/blog/category-chip.tsx` — small rounded-full chip
- `components/blog/tag-chip.tsx` — same style, different color

## File Layout

```
apps/marketing/
  app/
    api/
      publish/
        article/
          route.ts                  # POST (upsert)
          [slug]/
            route.ts                # DELETE
        metadata/
          categories/route.ts       # GET
          tags/route.ts             # GET
          context/route.ts          # GET
        media/route.ts              # POST
    blog/
      page.tsx                      # index
      [slug]/page.tsx               # article
      category/[slug]/page.tsx      # category filter
  components/
    blog/
      article-card.tsx
      category-chip.tsx
      tag-chip.tsx
    navbar.tsx                      # MODIFIED — add Blog link
    footer.tsx                      # MODIFIED — add Blog link
  lib/
    blog/
      auth.ts                       # requireApiKey
      supabase.ts                   # server-side client
      context.ts                    # hardcoded context groups
  next.config.ts                    # MODIFIED — add /uploads rewrite

supabase/
  migrations/
    00025_blog_system.sql           # tables, indexes, RLS, seeds, storage bucket
```

## Environment Variables

New (to be added to Vercel project settings):
- `BLOG_PUBLISH_API_KEY` — the `x-api-key` secret the dashboard sends. Value: `5e79deff-2a78-488f-ac2c-6be1b279e180`.
- `NEXT_PUBLIC_SITE_ORIGIN` — `https://easymicrosaas.com`. Used to build `publishedUrl` and for SEO canonical tags.

Existing (already set):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Error Handling

- All publish routes return JSON with an `error` field on failure.
- Status codes: `400` (validation), `401` (auth), `404` (not found), `409` (invalid category), `500` (unexpected).
- Unexpected errors: catch, log via `console.error`, return `500 { "error": "Internal server error" }`.
- No error-response wrapping — the dashboard parses exact shapes.

## Testing / Verification

Manual smoke tests via `curl` after deploy:
- Hit each endpoint with correct + incorrect API key
- Publish a test article → check it appears at `/blog/<slug>`
- Publish same slug again → verify `created: false`
- Publish with invalid category → verify `409` with `valid` array
- Delete that slug → verify it disappears from `/blog` but row still exists with `published = false`
- Upload a test image → verify the returned `/uploads/*` URL loads

Automated tests out of scope for this iteration — the marketing app has no existing test harness. Future work can add Playwright for the public blog pages once content volume justifies it.

## Out of Scope

- RSS feed (future)
- Sitemap XML (future, low priority)
- Pagination on blog index (until >20 articles)
- Tag filter pages (until tag adoption justifies it)
- Comments, reactions, share buttons
- Related articles
- Article search
- Multi-language support
