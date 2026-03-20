# Metricool Integration Plan

> **Scope:** Admin-only, two-way integration with Metricool for social media publishing and analytics
> **Date:** 2026-03-20
> **Status:** Draft

---

## Overview

Integrate Metricool's API into Marketing Machine so the internal admin team can:

1. **Publish content** directly from the app → Metricool → social platforms
2. **Pull analytics** back into the app — both platform-level dashboards and per-post performance

This is **admin-only** — no UI or access for `paid`/`free` users. A single shared Metricool account is used, with credentials stored as environment variables.

---

## Metricool API Summary

| Detail | Value |
|---|---|
| **Base URL** | `https://app.metricool.com/api` |
| **Auth** | `X-Mc-Auth` header + `userId`/`blogId` query params |
| **Min plan** | Advanced ($45-54/mo) |
| **Official SDK** | None for Node.js — build custom HTTP client |
| **Rate limits** | Undocumented — keep requests conservative |
| **Docs** | [Interactive API docs](https://app.metricool.com/resources/apidocs/index.html) |

### Key Endpoints

| Capability | Endpoint/Tool |
|---|---|
| Schedule a post | `post_schedule_post()` |
| Get scheduled posts | `get_scheduled_posts()` |
| Update scheduled post | `update_schedule_post()` |
| Best time to post | `get_best_time_to_post()` |
| Platform analytics | `get_analytics()` / `get_metrics()` |
| Per-post content data | Platform-specific content endpoints with date range filtering |
| Ad campaign data | Facebook Ads, Google Ads, TikTok Ads endpoints |
| Brand/account info | `get_brands()` / `get_brands_complete()` |
| Normalize media URL | `POST /api/actions/normalize/image/url` |

### Supported Platforms

Instagram, Facebook, TikTok, X (Twitter), LinkedIn, Threads, Bluesky, Pinterest, YouTube, Twitch

---

## Architecture

### New Components

```
lib/metricool/
├── client.ts          # HTTP client wrapper (auth, error handling, types)
├── types.ts           # TypeScript types for Metricool API responses
├── publish.ts         # Post scheduling/publishing helpers
└── analytics.ts       # Analytics fetching/parsing helpers

server/actions/
└── metricool.ts       # Server actions (admin-gated): publish, sync, refresh

app/api/cron/
└── daily/             # Replaces /api/cron/weekly-digest
    └── route.ts       # Combined: Metricool sync + weekly digest (Mondays only)

supabase/migrations/
├── 000XX_metricool_posts.sql
└── 000XX_metricool_analytics.sql
```

### Modified Pages (Admin-Conditional UI)

No new pages — Metricool features are added to existing pages behind `role === "admin"` checks:

| Existing Page | Admin Enhancement |
|---|---|
| `/content` (detail view) | "Publish to Metricool" button + per-post performance card after publishing |
| `/analytics` | New "Social Performance" section at top with platform-level Metricool metrics |
| `/schedule` | Metricool-scheduled posts overlaid on calendar with distinct badge/color |

Non-admin users see these pages unchanged.

### Environment Variables

```env
METRICOOL_API_TOKEN=xxx    # API token from Metricool account settings
METRICOOL_USER_ID=xxx      # Metricool user ID
METRICOOL_BLOG_ID=xxx      # Metricool brand/blog ID
```

---

## Database Schema

### `metricool_posts`

Maps content pieces to their Metricool scheduled/published posts and tracks per-post performance.

```sql
create table metricool_posts (
  id uuid primary key default gen_random_uuid(),
  content_piece_id uuid not null references content_pieces(id) on delete cascade,
  metricool_post_id text,            -- external ID from Metricool
  platform text not null,            -- e.g. 'instagram', 'linkedin', 'twitter'
  scheduled_at timestamptz,
  posted_at timestamptz,
  status text not null default 'pending',  -- pending | scheduled | posted | failed

  -- per-post performance (synced daily)
  impressions integer default 0,
  reach integer default 0,
  engagement integer default 0,
  clicks integer default 0,
  shares integer default 0,

  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS: admin only
alter table metricool_posts enable row level security;
create policy "Admin access only" on metricool_posts
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
```

### `metricool_analytics`

Stores daily platform-level analytics snapshots.

```sql
create table metricool_analytics (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  date date not null,
  followers integer default 0,
  reach integer default 0,
  impressions integer default 0,
  engagement integer default 0,
  profile_views integer default 0,

  created_at timestamptz not null default now(),
  unique(platform, date)
);

-- RLS: admin only
alter table metricool_analytics enable row level security;
create policy "Admin access only" on metricool_analytics
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
```

---

## Publishing Flow

### User Journey

1. Admin views a content piece (e.g., a LinkedIn post on the content detail page)
2. Clicks **"Publish to Metricool"** button (only visible to admins)
3. Modal appears with:
   - Platform selection (multi-select, pre-filled based on content type)
   - Date/time picker (pre-filled with `scheduled_for` if set)
   - Metricool's "best time to post" shown as a suggestion
   - Content preview per platform
4. Admin confirms → server action fires
5. Behind the scenes:
   - If content has images, normalize URLs via Metricool's media endpoint
   - Call `post_schedule_post()` with content + platform + schedule time
   - Create `metricool_posts` row with external post ID
   - Update content piece status to `scheduled`
6. Once Metricool confirms posting (via next sync), status updates to `posted`

### Content Type → Platform Mapping

| Content Type | Default Platforms |
|---|---|
| `linkedin-post` | LinkedIn |
| `twitter-post` | X (Twitter) |
| `twitter-thread` | X (Twitter) |
| `facebook-post` | Facebook |
| `instagram-reel-caption` | Instagram |
| `tiktok` | TikTok |

Admins can override and cross-post to additional platforms.

---

## Analytics

### Platform-Level Metrics (on `/analytics` page)

For admin users, the existing `/analytics` page gains a **"Social Performance"** section above the existing link tracking. This section shows:

- **Follower growth** per platform (line chart over time)
- **Reach & impressions** per platform (bar chart, selectable date range)
- **Engagement rate** per platform
- **Profile views** per platform
- Manual **"Refresh metrics"** button to pull latest data on demand

Non-admin users see the existing link analytics only — no changes.

Data source: `metricool_analytics` table, synced daily via cron.

### Per-Post Performance (on `/content` detail view)

When viewing a published content piece, admins see a **performance card** below the content:

- Impressions, reach, engagement, clicks, shares
- Platform badge showing where it was posted
- "Last synced" timestamp with manual refresh button

Data source: `metricool_posts` table, synced daily for posts in the last 30 days.

### Scheduled Posts (on `/schedule` page)

For admin users, the existing schedule calendar overlays **Metricool-scheduled posts** alongside planned content:

- Distinct color/badge to differentiate "scheduled via Metricool" from "planned"
- Click to view post details and publishing status
- Unified view of what's going out and when

Non-admin users see the existing schedule view only.

---

## Cron Strategy

### Consolidation: `/api/cron/daily`

Replace the existing `/api/cron/weekly-digest` with a single `/api/cron/daily` route that runs every day. This stays within Vercel free plan's one-cron limit.

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Daily Run Logic

```
1. Sync Metricool platform analytics (all connected platforms)
2. Sync per-post performance (posts published in last 30 days)
3. Update metricool_posts status (scheduled → posted for confirmed posts)
4. If Monday → run weekly digest email logic
```

### Security

- Cron endpoint protected by `CRON_SECRET` env var (existing pattern)
- All Metricool API calls use server-side env vars, never exposed to client

---

## Metricool HTTP Client

Lightweight wrapper — no external dependencies needed.

```typescript
// lib/metricool/client.ts — rough shape
class MetricoolClient {
  private token: string;
  private userId: string;
  private blogId: string;
  private baseUrl = "https://app.metricool.com/api";

  // Core request method with auth headers
  private async request(path: string, options?: RequestInit): Promise<T>;

  // Publishing
  async schedulePost(params: SchedulePostParams): Promise<SchedulePostResponse>;
  async getScheduledPosts(): Promise<ScheduledPost[]>;
  async updateScheduledPost(id: string, params: UpdatePostParams): Promise<void>;
  async getBestTimeToPost(network: string): Promise<BestTimeSlot[]>;
  async normalizeImageUrl(url: string): Promise<string>;

  // Analytics
  async getAnalytics(network: string, startDate: string, endDate: string): Promise<Analytics>;
  async getMetrics(network: string): Promise<MetricDefinition[]>;

  // Brands
  async getBrands(): Promise<Brand[]>;
}
```

---

## Implementation Order

### Phase 1: Foundation
1. Set up env vars and Metricool client (`lib/metricool/`)
2. Create database migrations for both tables
3. Create `server/actions/metricool.ts` with admin guards

### Phase 2: Publishing
4. Add "Publish to Metricool" button + modal on content detail page
5. Implement scheduling flow (platform select, time picker, best-time hint)
6. Wire up content piece status updates (`scheduled` → `posted`)

### Phase 3: Analytics
7. Add "Social Performance" section to `/analytics` page (admin-only)
8. Add per-post performance card to content detail view (admin-only)
9. Overlay Metricool-scheduled posts on `/schedule` calendar (admin-only)
10. Implement manual "Refresh metrics" functionality

### Phase 4: Cron
11. Refactor cron: merge weekly digest into `/api/cron/daily`
12. Add Metricool sync logic to daily cron
13. Test end-to-end flow

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Access level | Admin-only | Internal team tool, not customer-facing |
| Credentials | Single shared account (env vars) | Simplest for internal team |
| SDK | Custom HTTP client | No official Node.js SDK exists |
| Analytics sync | Daily cron + manual refresh | Conservative on rate limits, fits Vercel free plan |
| Cron strategy | Consolidated `/api/cron/daily` | One cron limit on Vercel free plan |
| Publishing UX | Button on existing content pages | Leverages existing content generation flow, no duplication |
| UI strategy | Enhance existing pages (admin-conditional) | No new routes, no new nav items — admins get richer versions of `/content`, `/analytics`, `/schedule` |

---

## Risks & Considerations

- **Undocumented rate limits** — Keep requests conservative. Daily sync with 30-day window should be safe. Add retry logic with exponential backoff.
- **No official SDK** — Custom client is simple to build but needs maintenance if API changes. Pin to known working endpoints from the Swagger spec.
- **Media handling** — Images must be publicly accessible URLs. Use Metricool's normalize endpoint to re-host before scheduling.
- **Metricool plan cost** — Advanced plan required ($45-54/mo). Factor into operational costs.
- **Post status tracking** — Metricool may not have webhooks for post status changes. Rely on daily sync to update `scheduled` → `posted`.
