# Metricool Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-way Metricool integration (publish content + pull analytics) for admin users only.

**Architecture:** Custom HTTP client wraps Metricool's REST API (no SDK). Two new DB tables track published posts and platform analytics. Existing pages (`/content`, `/analytics`, `/schedule`) gain admin-only UI enhancements. A consolidated daily cron replaces the weekly-digest cron to handle both digest emails and Metricool syncs within Vercel's free plan limit.

**Tech Stack:** Next.js 15 (App Router), Supabase (PostgreSQL + RLS), TypeScript, Tailwind CSS, Metricool REST API

**Spec:** `docs/METRICOOL.md`

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `apps/app/lib/metricool/types.ts` | TypeScript types for Metricool API requests/responses |
| `apps/app/lib/metricool/client.ts` | HTTP client wrapper (auth, error handling, retries) |
| `apps/app/lib/metricool/publish.ts` | Helpers for scheduling posts + normalizing media |
| `apps/app/lib/metricool/analytics.ts` | Helpers for fetching platform + per-post analytics |
| `apps/app/server/actions/metricool.ts` | Server actions (admin-gated): publish, sync, refresh |
| `apps/app/components/metricool-publish-modal.tsx` | Modal for publishing content to Metricool |
| `apps/app/components/metricool-performance-card.tsx` | Per-post performance stats card (admin-only) |
| `apps/app/app/(dashboard)/analytics/social-performance.tsx` | Platform-level social metrics section (admin-only) |
| `apps/app/app/api/cron/daily/route.ts` | Consolidated daily cron (Metricool sync + weekly digest on Mondays) |
| `supabase/migrations/00023_metricool_posts.sql` | `metricool_posts` table + RLS |
| `supabase/migrations/00024_metricool_analytics.sql` | `metricool_analytics` table + RLS |

### Modified Files

| File | Change |
|---|---|
| `apps/app/app/(dashboard)/content/content-list.tsx` | Add "Publish to Metricool" button + performance card in expanded view (admin-only) |
| `apps/app/app/(dashboard)/analytics/page.tsx` | Pass `role` to dashboard, fetch `metricool_analytics` for admins |
| `apps/app/app/(dashboard)/analytics/analytics-dashboard.tsx` | Render `SocialPerformance` section above link analytics for admins |
| `apps/app/app/(dashboard)/schedule/page.tsx` | Fetch `metricool_posts` for admins, merge into schedule data |
| `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx` | Render Metricool-scheduled posts with distinct badge/color |
| `vercel.json` | Update cron path from `/api/cron/weekly-digest` to `/api/cron/daily`, schedule `0 9 * * *` |

---

## Task 1: Metricool Types

**Files:**
- Create: `apps/app/lib/metricool/types.ts`

- [ ] **Step 1: Create type definitions**

```typescript
// apps/app/lib/metricool/types.ts

// ── Request types ──────────────────────────────────

export interface SchedulePostParams {
  networks: string[];          // e.g. ["LINKEDIN", "TWITTER"]
  text: string;
  scheduledAt: string;         // ISO 8601 datetime
  mediaUrls?: string[];        // normalized image URLs
}

export interface BestTimeRequest {
  network: string;             // e.g. "LINKEDIN"
}

export interface AnalyticsRequest {
  network: string;
  initDate: string;            // YYYY-MM-DD
  endDate: string;             // YYYY-MM-DD
}

// ── Response types ─────────────────────────────────

export interface SchedulePostResponse {
  id: string;                  // Metricool's post ID
  status: string;
}

export interface BestTimeSlot {
  day: number;                 // 0-6 (Sun-Sat)
  hour: number;                // 0-23
  score: number;
}

export interface PlatformAnalytics {
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  profileViews: number;
}

export interface PostPerformance {
  postId: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  shares: number;
}

export interface MetricoolBrand {
  blogId: string;
  name: string;
  networks: string[];
}

// ── Shared constants ───────────────────────────────

export const CONTENT_TYPE_TO_NETWORK: Record<string, string> = {
  "linkedin-post": "LINKEDIN",
  "twitter-post": "TWITTER",
  "twitter-thread": "TWITTER",
  "facebook-post": "FACEBOOK",
  "instagram-reel-caption": "INSTAGRAM",
  tiktok: "TIKTOK",
};

export const NETWORK_LABELS: Record<string, string> = {
  LINKEDIN: "LinkedIn",
  TWITTER: "X (Twitter)",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  THREADS: "Threads",
  BLUESKY: "Bluesky",
  PINTEREST: "Pinterest",
  YOUTUBE: "YouTube",
};

export const ALL_NETWORKS = Object.keys(NETWORK_LABELS);
```

- [ ] **Step 2: Commit**

```bash
git add apps/app/lib/metricool/types.ts
git commit -m "feat(metricool): add TypeScript types and constants"
```

---

## Task 2: Metricool HTTP Client

**Files:**
- Create: `apps/app/lib/metricool/client.ts`

- [ ] **Step 1: Create the HTTP client**

```typescript
// apps/app/lib/metricool/client.ts

import type {
  SchedulePostParams,
  SchedulePostResponse,
  BestTimeSlot,
  PlatformAnalytics,
  PostPerformance,
  AnalyticsRequest,
  MetricoolBrand,
} from "./types";

const BASE_URL = "https://app.metricool.com/api";

function getConfig() {
  const token = process.env.METRICOOL_API_TOKEN;
  const userId = process.env.METRICOOL_USER_ID;
  const blogId = process.env.METRICOOL_BLOG_ID;
  if (!token || !userId || !blogId) {
    throw new Error("Missing Metricool env vars (METRICOOL_API_TOKEN, METRICOOL_USER_ID, METRICOOL_BLOG_ID)");
  }
  return { token, userId, blogId };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { token, userId, blogId } = getConfig();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${path}${separator}userId=${userId}&blogId=${blogId}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Mc-Auth": token,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Metricool API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Publishing ─────────────────────────────────────

export async function schedulePost(
  params: SchedulePostParams,
): Promise<SchedulePostResponse> {
  return request<SchedulePostResponse>("/schedule/post", {
    method: "POST",
    body: JSON.stringify({
      networks: params.networks,
      text: params.text,
      scheduledAt: params.scheduledAt,
      mediaUrls: params.mediaUrls ?? [],
    }),
  });
}

export async function getScheduledPosts(): Promise<unknown[]> {
  return request<unknown[]>("/schedule/posts");
}

export async function updateScheduledPost(
  postId: string,
  params: Partial<SchedulePostParams>,
): Promise<void> {
  await request(`/schedule/post/${postId}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

export async function getBestTimeToPost(
  network: string,
): Promise<BestTimeSlot[]> {
  return request<BestTimeSlot[]>(`/schedule/besttime?network=${network}`);
}

export async function normalizeImageUrl(imageUrl: string): Promise<string> {
  const result = await request<{ url: string }>("/actions/normalize/image/url", {
    method: "POST",
    body: JSON.stringify({ url: imageUrl }),
  });
  return result.url;
}

// ── Analytics ──────────────────────────────────────

export async function getAnalytics(
  params: AnalyticsRequest,
): Promise<PlatformAnalytics> {
  return request<PlatformAnalytics>(
    `/analytics/${params.network}?init_date=${params.initDate}&end_date=${params.endDate}`,
  );
}

export async function getPostPerformance(
  network: string,
  initDate: string,
  endDate: string,
): Promise<PostPerformance[]> {
  return request<PostPerformance[]>(
    `/analytics/${network}/posts?init_date=${initDate}&end_date=${endDate}`,
  );
}

export async function getMetrics(network: string): Promise<unknown[]> {
  return request<unknown[]>(`/analytics/${network}/metrics`);
}

// ── Brands ─────────────────────────────────────────

export async function getBrands(): Promise<MetricoolBrand[]> {
  return request<MetricoolBrand[]>("/admin/simpleProfiles");
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/app/lib/metricool/client.ts
git commit -m "feat(metricool): add HTTP client wrapper"
```

---

## Task 3: Database Migrations

**Files:**
- Create: `supabase/migrations/00023_metricool_posts.sql`
- Create: `supabase/migrations/00024_metricool_analytics.sql`

- [ ] **Step 1: Create metricool_posts migration**

```sql
-- supabase/migrations/00023_metricool_posts.sql

create table metricool_posts (
  id uuid primary key default gen_random_uuid(),
  content_piece_id uuid not null references content_pieces(id) on delete cascade,
  metricool_post_id text,
  platform text not null,
  scheduled_at timestamptz,
  posted_at timestamptz,
  status text not null default 'pending',

  impressions integer not null default 0,
  reach integer not null default 0,
  engagement integer not null default 0,
  clicks integer not null default 0,
  shares integer not null default 0,

  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_metricool_posts_content_piece on metricool_posts(content_piece_id);
create index idx_metricool_posts_status on metricool_posts(status);

alter table metricool_posts enable row level security;

create policy "Admin read metricool_posts"
  on metricool_posts for select
  using (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));

create policy "Admin insert metricool_posts"
  on metricool_posts for insert
  with check (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));

create policy "Admin update metricool_posts"
  on metricool_posts for update
  using (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));
```

- [ ] **Step 2: Create metricool_analytics migration**

```sql
-- supabase/migrations/00024_metricool_analytics.sql

create table metricool_analytics (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  date date not null,
  followers integer not null default 0,
  reach integer not null default 0,
  impressions integer not null default 0,
  engagement integer not null default 0,
  profile_views integer not null default 0,
  created_at timestamptz not null default now(),
  unique(platform, date)
);

create index idx_metricool_analytics_platform_date on metricool_analytics(platform, date);

alter table metricool_analytics enable row level security;

create policy "Admin read metricool_analytics"
  on metricool_analytics for select
  using (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));

create policy "Admin insert metricool_analytics"
  on metricool_analytics for insert
  with check (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));

create policy "Admin update metricool_analytics"
  on metricool_analytics for update
  using (exists (
    select 1 from profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ));
```

- [ ] **Step 3: Apply migrations locally**

Run: `npx supabase db push` (or however the project applies migrations — check `package.json` scripts)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00023_metricool_posts.sql supabase/migrations/00024_metricool_analytics.sql
git commit -m "feat(metricool): add metricool_posts and metricool_analytics tables"
```

---

## Task 4: Publish & Analytics Helper Libraries

**Files:**
- Create: `apps/app/lib/metricool/publish.ts`
- Create: `apps/app/lib/metricool/analytics.ts`

- [ ] **Step 1: Create publish helpers**

```typescript
// apps/app/lib/metricool/publish.ts

import { schedulePost, normalizeImageUrl, getBestTimeToPost } from "./client";
import type { SchedulePostResponse, BestTimeSlot } from "./types";
import { CONTENT_TYPE_TO_NETWORK } from "./types";

export function getDefaultNetwork(contentType: string): string | null {
  return CONTENT_TYPE_TO_NETWORK[contentType] ?? null;
}

export async function publishToMetricool(opts: {
  text: string;
  networks: string[];
  scheduledAt: string;
  imageUrl?: string | null;
}): Promise<SchedulePostResponse> {
  let mediaUrls: string[] = [];

  if (opts.imageUrl) {
    const normalized = await normalizeImageUrl(opts.imageUrl);
    mediaUrls = [normalized];
  }

  return schedulePost({
    networks: opts.networks,
    text: opts.text,
    scheduledAt: opts.scheduledAt,
    mediaUrls,
  });
}

export async function fetchBestTimes(network: string): Promise<BestTimeSlot[]> {
  return getBestTimeToPost(network);
}
```

- [ ] **Step 2: Create analytics helpers**

```typescript
// apps/app/lib/metricool/analytics.ts

import { getAnalytics, getPostPerformance } from "./client";
import type { PlatformAnalytics, PostPerformance } from "./types";
import { ALL_NETWORKS } from "./types";

export async function fetchPlatformAnalytics(
  initDate: string,
  endDate: string,
): Promise<Record<string, PlatformAnalytics>> {
  const results: Record<string, PlatformAnalytics> = {};

  // Fetch in sequence to be conservative with rate limits
  for (const network of ALL_NETWORKS) {
    try {
      results[network] = await getAnalytics({ network, initDate, endDate });
    } catch {
      // Skip networks that error (may not be connected)
      continue;
    }
  }

  return results;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getDateRangeForDays(days: number): { initDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    initDate: formatDate(start),
    endDate: formatDate(end),
  };
}

export async function fetchPostPerformance(
  network: string,
  initDate: string,
  endDate: string,
): Promise<PostPerformance[]> {
  try {
    return await getPostPerformance(network, initDate, endDate);
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/app/lib/metricool/publish.ts apps/app/lib/metricool/analytics.ts
git commit -m "feat(metricool): add publish and analytics helper libraries"
```

---

## Task 5: Server Actions (Admin-Gated)

**Files:**
- Create: `apps/app/server/actions/metricool.ts`

- [ ] **Step 1: Create metricool server actions**

This file follows the exact pattern from `apps/app/server/actions/admin.ts` — auth check, admin guard, service client for writes.

```typescript
// apps/app/server/actions/metricool.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { publishToMetricool, fetchBestTimes } from "@/lib/metricool/publish";
import { fetchPlatformAnalytics, getDateRangeForDays } from "@/lib/metricool/analytics";
import type { BestTimeSlot } from "@/lib/metricool/types";

// ── Auth helper ────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const, user: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Admin access required" as const, user: null, supabase };
  }

  return { error: null, user, supabase };
}

// ── Publish a content piece via Metricool ──────────

export async function publishContentToMetricool(opts: {
  contentPieceId: string;
  networks: string[];
  scheduledAt: string;
}) {
  const { error, supabase } = await requireAdmin();
  if (error) return { error };

  // Fetch the content piece
  const { data: piece } = await supabase
    .from("content_pieces")
    .select("id, body, image_url, status")
    .eq("id", opts.contentPieceId)
    .single();

  if (!piece) return { error: "Content piece not found" };

  // Publish to Metricool
  let result;
  try {
    result = await publishToMetricool({
      text: piece.body,
      networks: opts.networks,
      scheduledAt: opts.scheduledAt,
      imageUrl: piece.image_url,
    });
  } catch (err) {
    return { error: `Metricool API error: ${err instanceof Error ? err.message : "Unknown error"}` };
  }

  // Create metricool_posts rows (one per network)
  const service = createServiceClient();
  const rows = opts.networks.map((network) => ({
    content_piece_id: opts.contentPieceId,
    metricool_post_id: result.id,
    platform: network.toLowerCase(),
    scheduled_at: opts.scheduledAt,
    status: "scheduled",
  }));

  const { error: insertError } = await service
    .from("metricool_posts")
    .insert(rows);

  if (insertError) return { error: insertError.message };

  // Update content piece status to scheduled
  await service
    .from("content_pieces")
    .update({ status: "scheduled", scheduled_for: opts.scheduledAt })
    .eq("id", opts.contentPieceId);

  revalidatePath("/content");
  revalidatePath("/schedule");
  return { success: true, metricoolPostId: result.id };
}

// ── Get best time to post ──────────────────────────

export async function getMetricoolBestTimes(
  network: string,
): Promise<{ error?: string; data?: BestTimeSlot[] }> {
  const { error } = await requireAdmin();
  if (error) return { error };

  try {
    const data = await fetchBestTimes(network);
    return { data };
  } catch (err) {
    return { error: `Failed to fetch best times: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

// ── Refresh analytics on demand ────────────────────

export async function refreshMetricoolAnalytics() {
  const { error } = await requireAdmin();
  if (error) return { error };

  const service = createServiceClient();
  const { initDate, endDate } = getDateRangeForDays(30);

  try {
    const analytics = await fetchPlatformAnalytics(initDate, endDate);

    for (const [network, data] of Object.entries(analytics)) {
      await service
        .from("metricool_analytics")
        .upsert(
          {
            platform: network.toLowerCase(),
            date: endDate,
            followers: data.followers,
            reach: data.reach,
            impressions: data.impressions,
            engagement: data.engagement,
            profile_views: data.profileViews,
          },
          { onConflict: "platform,date" },
        );
    }
  } catch (err) {
    return { error: `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}` };
  }

  revalidatePath("/analytics");
  return { success: true };
}

// ── Get metricool posts for a content piece ────────

export async function getMetricoolPostsForContent(contentPieceId: string) {
  const { error, supabase } = await requireAdmin();
  if (error) return { error, data: null };

  const { data } = await supabase
    .from("metricool_posts")
    .select("*")
    .eq("content_piece_id", contentPieceId)
    .order("created_at", { ascending: false });

  return { data: data ?? [] };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/app/server/actions/metricool.ts
git commit -m "feat(metricool): add admin-gated server actions for publish and analytics"
```

---

## Task 6: Publish Modal Component

**Files:**
- Create: `apps/app/components/metricool-publish-modal.tsx`

- [ ] **Step 1: Create the publish modal**

This follows the slide-over pattern from `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx` (ContentPanel, ~line 695). Uses `@/components/date-picker` for scheduling.

```typescript
// apps/app/components/metricool-publish-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { publishContentToMetricool, getMetricoolBestTimes } from "@/server/actions/metricool";
import { CONTENT_TYPE_TO_NETWORK, NETWORK_LABELS, ALL_NETWORKS } from "@/lib/metricool/types";
import type { BestTimeSlot } from "@/lib/metricool/types";

interface Props {
  contentPieceId: string;
  contentType: string;
  contentBody: string;
  imageUrl: string | null;
  scheduledFor: string | null;
  onClose: () => void;
  onPublished: () => void;
}

export function MetricoolPublishModal({
  contentPieceId,
  contentType,
  contentBody,
  imageUrl,
  scheduledFor,
  onClose,
  onPublished,
}: Props) {
  const defaultNetwork = CONTENT_TYPE_TO_NETWORK[contentType];
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(
    defaultNetwork ? [defaultNetwork] : [],
  );
  const [scheduledAt, setScheduledAt] = useState(
    scheduledFor ?? new Date(Date.now() + 3600_000).toISOString().slice(0, 16),
  );
  const [bestTimes, setBestTimes] = useState<BestTimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch best times for the first selected network
  useEffect(() => {
    if (selectedNetworks.length === 0) return;
    getMetricoolBestTimes(selectedNetworks[0]).then((res) => {
      if (res.data) setBestTimes(res.data);
    });
  }, [selectedNetworks]);

  function toggleNetwork(network: string) {
    setSelectedNetworks((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network],
    );
  }

  async function handlePublish() {
    if (selectedNetworks.length === 0) return;
    setLoading(true);
    setError(null);

    const result = await publishContentToMetricool({
      contentPieceId,
      networks: selectedNetworks,
      scheduledAt: new Date(scheduledAt).toISOString(),
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onPublished();
      onClose();
    }
  }

  const topBestTime = bestTimes.length > 0
    ? bestTimes.sort((a, b) => b.score - a.score)[0]
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-surface-primary shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold">Publish to Metricool</h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Platform selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {ALL_NETWORKS.map((network) => (
                <button
                  key={network}
                  onClick={() => toggleNetwork(network)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedNetworks.includes(network)
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                      : "border-line text-content-muted hover:border-zinc-400"
                  }`}
                >
                  {NETWORK_LABELS[network]}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule time */}
          <div>
            <label className="mb-2 block text-sm font-medium">Schedule for</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-sm"
            />
            {topBestTime && (
              <p className="mt-1 text-xs text-content-muted">
                💡 Best time suggestion: {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][topBestTime.day]} at {topBestTime.hour}:00
              </p>
            )}
          </div>

          {/* Content preview */}
          <div>
            <label className="mb-2 block text-sm font-medium">Preview</label>
            <div className="rounded-lg border border-line bg-surface-card p-3">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  className="mb-2 h-32 w-full rounded-md object-cover"
                />
              )}
              <p className="whitespace-pre-wrap text-sm text-content-secondary line-clamp-6">
                {contentBody}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line px-6 py-4">
          <button
            onClick={handlePublish}
            disabled={loading || selectedNetworks.length === 0}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Publishing..." : `Schedule on ${selectedNetworks.length} platform${selectedNetworks.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/app/components/metricool-publish-modal.tsx
git commit -m "feat(metricool): add publish modal component"
```

---

## Task 7: Performance Card Component

**Files:**
- Create: `apps/app/components/metricool-performance-card.tsx`

- [ ] **Step 1: Create the per-post performance card**

```typescript
// apps/app/components/metricool-performance-card.tsx
"use client";

import { useState, useEffect } from "react";
import { getMetricoolPostsForContent, refreshMetricoolAnalytics } from "@/server/actions/metricool";
import { NETWORK_LABELS } from "@/lib/metricool/types";

interface MetricoolPost {
  id: string;
  platform: string;
  status: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  shares: number;
  scheduled_at: string | null;
  posted_at: string | null;
  last_synced_at: string | null;
}

export function MetricoolPerformanceCard({ contentPieceId }: { contentPieceId: string }) {
  const [posts, setPosts] = useState<MetricoolPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function loadPosts() {
    getMetricoolPostsForContent(contentPieceId).then((res) => {
      if (res.data) setPosts(res.data as MetricoolPost[]);
      setLoading(false);
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refreshMetricoolAnalytics();
    loadPosts();
    setRefreshing(false);
  }

  useEffect(() => {
    loadPosts();
  }, [contentPieceId]);

  if (loading) return null;
  if (posts.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-line bg-surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">Metricool Performance</h4>
        <div className="flex items-center gap-2">
          {posts[0]?.last_synced_at && (
            <span className="text-xs text-content-muted">
              Synced {new Date(posts[0].last_synced_at).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-md border border-line px-2 py-0.5 text-xs text-content-muted hover:border-zinc-400 disabled:opacity-50"
          >
            {refreshing ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center gap-3">
            {/* Platform badge */}
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
              post.status === "posted"
                ? "bg-green-500/10 text-green-400"
                : post.status === "scheduled"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400"
            }`}>
              {NETWORK_LABELS[post.platform.toUpperCase()] ?? post.platform}
            </span>

            {/* Stats */}
            {post.status === "posted" ? (
              <div className="flex flex-wrap gap-4 text-xs text-content-muted">
                <span>{post.impressions.toLocaleString()} impressions</span>
                <span>{post.reach.toLocaleString()} reach</span>
                <span>{post.engagement.toLocaleString()} engagement</span>
                <span>{post.clicks.toLocaleString()} clicks</span>
                <span>{post.shares.toLocaleString()} shares</span>
              </div>
            ) : (
              <span className="text-xs text-content-muted">
                {post.status === "scheduled" && post.scheduled_at
                  ? `Scheduled for ${new Date(post.scheduled_at).toLocaleString()}`
                  : post.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/app/components/metricool-performance-card.tsx
git commit -m "feat(metricool): add per-post performance card component"
```

---

## Task 8: Integrate Publish Button + Performance Card into Content List

**Files:**
- Modify: `apps/app/app/(dashboard)/content/content-list.tsx`
- Modify: `apps/app/app/(dashboard)/content/page.tsx`

- [ ] **Step 1: Pass user role to ContentList**

In `apps/app/app/(dashboard)/content/page.tsx`, import `getUserWithRole` and pass role to `ContentList`:

```typescript
// At the top, add import:
import { getUserWithRole } from "@/server/auth";

// Inside the component, after requireAuth():
const { role } = await getUserWithRole();

// In the JSX, add role prop to ContentList:
<ContentList
  pieces={pieces as any}
  products={(products ?? []) as { id: string; name: string }[]}
  role={role}
/>
```

- [ ] **Step 2: Add Metricool button and card to ContentList**

In `apps/app/app/(dashboard)/content/content-list.tsx`:

Add imports at the top (after existing imports ~line 14):

```typescript
import { MetricoolPublishModal } from "@/components/metricool-publish-modal";
import { MetricoolPerformanceCard } from "@/components/metricool-performance-card";
```

Update the component props interface and function signature to accept `role`:

```typescript
// Update the ContentList props to include role
// Near line ~65 where ContentList is defined, add role to the destructured props:
export function ContentList({
  pieces: initialPieces,
  products,
  role,
}: {
  pieces: ContentPieceRow[];
  products: { id: string; name: string }[];
  role: "admin" | "paid" | "free";
}) {
```

Add state for the publish modal (inside the component, near other useState calls):

```typescript
const [publishingPieceId, setPublishingPieceId] = useState<string | null>(null);
```

In the expanded content area (after the ImageGenerator block, ~line 526), add the admin-only Metricool section:

```typescript
{/* Metricool — admin only */}
{isExpanded && role === "admin" && (
  <>
    <div className="mt-3 flex items-center gap-2">
      <button
        onClick={() => setPublishingPieceId(piece.id)}
        className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
      >
        Publish to Metricool
      </button>
    </div>
    <MetricoolPerformanceCard contentPieceId={piece.id} />
  </>
)}
```

At the bottom of the component's return JSX (before the final closing tags), add the modal:

```typescript
{publishingPieceId && (() => {
  const piece = initialPieces.find((p) => p.id === publishingPieceId);
  return piece ? (
    <MetricoolPublishModal
      contentPieceId={publishingPieceId}
      contentType={piece.type}
      contentBody={piece.body}
      imageUrl={piece.image_url}
      scheduledFor={piece.scheduled_for}
      onClose={() => setPublishingPieceId(null)}
      onPublished={() => setPublishingPieceId(null)}
    />
  ) : null;
})()}
```

- [ ] **Step 3: Verify the app compiles**

Run: `cd apps/app && npx next build`
Expected: Build succeeds (Metricool API not called at build time)

- [ ] **Step 4: Commit**

```bash
git add apps/app/app/(dashboard)/content/content-list.tsx apps/app/app/(dashboard)/content/page.tsx
git commit -m "feat(metricool): add publish button and performance card to content page"
```

---

## Task 9: Social Performance Section on Analytics Page

**Files:**
- Create: `apps/app/app/(dashboard)/analytics/social-performance.tsx`
- Modify: `apps/app/app/(dashboard)/analytics/page.tsx`
- Modify: `apps/app/app/(dashboard)/analytics/analytics-dashboard.tsx`

- [ ] **Step 1: Create SocialPerformance component**

> **Note:** V1 uses a stats grid per platform. Charts (follower growth line chart, reach/impressions bar chart with date range selector) can be added in a Phase 2 iteration once the data pipeline is proven.

```typescript
// apps/app/app/(dashboard)/analytics/social-performance.tsx
"use client";

import { useState } from "react";
import { refreshMetricoolAnalytics } from "@/server/actions/metricool";
import { NETWORK_LABELS } from "@/lib/metricool/types";

interface AnalyticsRow {
  platform: string;
  date: string;
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  profile_views: number;
}

export function SocialPerformance({ data }: { data: AnalyticsRow[] }) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshMetricoolAnalytics();
    setRefreshing(false);
  }

  // Group by platform, latest entry per platform
  const latestByPlatform = new Map<string, AnalyticsRow>();
  for (const row of data) {
    const existing = latestByPlatform.get(row.platform);
    if (!existing || row.date > existing.date) {
      latestByPlatform.set(row.platform, row);
    }
  }

  const platforms = Array.from(latestByPlatform.values());

  if (platforms.length === 0 && data.length === 0) {
    return (
      <div className="mb-8 rounded-xl border border-dashed border-line p-6 text-center">
        <p className="text-sm text-content-muted">
          No social analytics yet. Connect Metricool and sync to see platform metrics.
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {refreshing ? "Syncing..." : "Sync Now"}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Social Performance</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg border border-line px-3 py-1.5 text-xs text-content-muted transition-colors hover:border-zinc-400 disabled:opacity-50"
        >
          {refreshing ? "Syncing..." : "Refresh Metrics"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((p) => (
          <div
            key={p.platform}
            className="rounded-xl border border-line bg-surface-card p-4"
          >
            <h3 className="mb-3 text-sm font-medium">
              {NETWORK_LABELS[p.platform.toUpperCase()] ?? p.platform}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-content-muted">Followers</p>
                <p className="font-semibold">{p.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-content-muted">Reach</p>
                <p className="font-semibold">{p.reach.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-content-muted">Impressions</p>
                <p className="font-semibold">{p.impressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-content-muted">Engagement</p>
                <p className="font-semibold">{p.engagement.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update analytics page to fetch social data for admins**

In `apps/app/app/(dashboard)/analytics/page.tsx`, add:

```typescript
// Add import at top:
import { getUserWithRole } from "@/server/auth";

// After the existing data fetches, add:
const { role } = await getUserWithRole();

let socialAnalytics: any[] = [];
if (role === "admin") {
  const { data: metricoolData } = await supabase
    .from("metricool_analytics")
    .select("*")
    .order("date", { ascending: false })
    .limit(100);
  socialAnalytics = metricoolData ?? [];
}

// Pass to AnalyticsDashboard:
<AnalyticsDashboard
  links={links ?? []}
  recentClicks={recentClicks}
  products={(products ?? []) as any}
  role={role}
  socialAnalytics={socialAnalytics}
/>
```

- [ ] **Step 3: Update AnalyticsDashboard to render social section**

In `apps/app/app/(dashboard)/analytics/analytics-dashboard.tsx`, add:

```typescript
// Add import:
import { SocialPerformance } from "./social-performance";

// Update props to include role and socialAnalytics
// At the top of the component's JSX return, before existing content, add:
{role === "admin" && <SocialPerformance data={socialAnalytics} />}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/app && npx next build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add apps/app/app/(dashboard)/analytics/social-performance.tsx apps/app/app/(dashboard)/analytics/page.tsx apps/app/app/(dashboard)/analytics/analytics-dashboard.tsx
git commit -m "feat(metricool): add social performance section to analytics page (admin-only)"
```

---

## Task 10: Metricool Posts on Schedule Calendar

**Files:**
- Modify: `apps/app/app/(dashboard)/schedule/page.tsx`
- Modify: `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx`

- [ ] **Step 1: Fetch metricool_posts in schedule page**

In `apps/app/app/(dashboard)/schedule/page.tsx`:

```typescript
// Add import:
import { getUserWithRole } from "@/server/auth";

// After existing data fetches:
const { role } = await getUserWithRole();

let metricoolPosts: any[] = [];
if (role === "admin") {
  const { data } = await supabase
    .from("metricool_posts")
    .select("id, content_piece_id, platform, scheduled_at, posted_at, status")
    .in("status", ["scheduled", "posted"])
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate);
  metricoolPosts = data ?? [];
}

// Pass to ScheduleCalendar as a new prop:
// metricoolPosts={metricoolPosts}
```

- [ ] **Step 2: Render Metricool posts on calendar**

In `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx`:

Add a new `MetricoolBadge` inline where calendar items are rendered. For each day cell, after rendering the existing content pieces, render Metricool-scheduled posts with a distinct style:

```typescript
// In the day cell rendering, after existing pieces:
{metricoolPosts
  .filter((mp) => mp.scheduled_at?.startsWith(dateKey))
  .map((mp) => (
    <div
      key={mp.id}
      className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span className="truncate text-emerald-400">
        {mp.platform} — {mp.status}
      </span>
    </div>
  ))}
```

- [ ] **Step 3: Verify build**

Run: `cd apps/app && npx next build`

- [ ] **Step 4: Commit**

```bash
git add apps/app/app/(dashboard)/schedule/page.tsx apps/app/app/(dashboard)/schedule/schedule-calendar.tsx
git commit -m "feat(metricool): overlay Metricool-scheduled posts on schedule calendar"
```

---

## Task 11: Consolidated Daily Cron

**Files:**
- Create: `apps/app/app/api/cron/daily/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the daily cron route**

This combines Metricool sync + the existing weekly digest logic. The weekly digest code stays in its original files — we just call it from here.

```typescript
// apps/app/app/api/cron/daily/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchPlatformAnalytics, fetchPostPerformance, getDateRangeForDays } from "@/lib/metricool/analytics";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};
  const supabase = createServiceClient();

  // ── 1. Sync Metricool platform analytics ──────────
  if (process.env.METRICOOL_API_TOKEN) {
    try {
      const { initDate, endDate } = getDateRangeForDays(30);
      const analytics = await fetchPlatformAnalytics(initDate, endDate);

      for (const [network, data] of Object.entries(analytics)) {
        await supabase
          .from("metricool_analytics")
          .upsert(
            {
              platform: network.toLowerCase(),
              date: endDate,
              followers: data.followers,
              reach: data.reach,
              impressions: data.impressions,
              engagement: data.engagement,
              profile_views: data.profileViews,
            },
            { onConflict: "platform,date" },
          );
      }
      results.metricoolAnalytics = `Synced ${Object.keys(analytics).length} platforms`;
    } catch (err) {
      results.metricoolAnalytics = `Error: ${err instanceof Error ? err.message : "Unknown"}`;
    }

    // ── 2. Update metricool_posts statuses ────────────
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Mark scheduled posts whose scheduled_at has passed as "posted"
      const { count } = await supabase
        .from("metricool_posts")
        .update({ status: "posted", posted_at: new Date().toISOString() })
        .eq("status", "scheduled")
        .lt("scheduled_at", new Date().toISOString())
        .select("id", { count: "exact", head: true });

      results.metricoolPostUpdates = `Updated ${count ?? 0} posts to posted`;
    } catch (err) {
      results.metricoolPostUpdates = `Error: ${err instanceof Error ? err.message : "Unknown"}`;
    }

    // ── 3. Sync per-post performance metrics ──────────
    try {
      const { initDate, endDate } = getDateRangeForDays(30);

      // Get all posted metricool_posts from the last 30 days
      const { data: postedPosts } = await supabase
        .from("metricool_posts")
        .select("id, platform, metricool_post_id")
        .eq("status", "posted")
        .gte("posted_at", new Date(Date.now() - 30 * 86400_000).toISOString());

      if (postedPosts && postedPosts.length > 0) {
        // Get unique platforms
        const platforms = [...new Set(postedPosts.map((p) => p.platform))];
        let synced = 0;

        for (const platform of platforms) {
          const performances = await fetchPostPerformance(
            platform.toUpperCase(),
            initDate,
            endDate,
          );

          // Match Metricool post IDs to our rows and update
          for (const perf of performances) {
            const matchingPost = postedPosts.find(
              (p) => p.metricool_post_id === perf.postId,
            );
            if (matchingPost) {
              await supabase
                .from("metricool_posts")
                .update({
                  impressions: perf.impressions,
                  reach: perf.reach,
                  engagement: perf.engagement,
                  clicks: perf.clicks,
                  shares: perf.shares,
                  last_synced_at: new Date().toISOString(),
                })
                .eq("id", matchingPost.id);
              synced++;
            }
          }
        }
        results.metricoolPostPerformance = `Synced performance for ${synced} posts`;
      } else {
        results.metricoolPostPerformance = "No posted posts to sync";
      }
    } catch (err) {
      results.metricoolPostPerformance = `Error: ${err instanceof Error ? err.message : "Unknown"}`;
    }
  } else {
    results.metricoolAnalytics = "Skipped (no API token configured)";
  }

  // ── 4. Weekly digest (Mondays only) ────────────────
  const today = new Date();
  if (today.getDay() === 1) {
    try {
      // Dynamically import to avoid loading digest deps every day
      const { GET: digestHandler } = await import("../weekly-digest/route");
      // Call the existing digest handler directly
      // We pass the same request so it has the auth header
      const digestResponse = await digestHandler(request);
      const digestResult = await digestResponse.json();
      results.weeklyDigest = digestResult.error
        ? `Error: ${digestResult.error}`
        : `Sent ${digestResult.sent ?? 0} digests`;
    } catch (err) {
      results.weeklyDigest = `Error: ${err instanceof Error ? err.message : "Unknown"}`;
    }
  } else {
    results.weeklyDigest = "Skipped (not Monday)";
  }

  return NextResponse.json({ success: true, results });
}
```

- [ ] **Step 2: Update vercel.json**

Replace the existing cron config:

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

- [ ] **Step 3: Verify build**

Run: `cd apps/app && npx next build`

- [ ] **Step 4: Commit**

```bash
git add apps/app/app/api/cron/daily/route.ts vercel.json
git commit -m "feat(metricool): add consolidated daily cron (analytics sync + weekly digest)"
```

---

## Task 12: Final Verification & Cleanup

- [ ] **Step 1: Full build check**

Run: `cd apps/app && npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Verify file structure**

Check that all new files exist:
```
apps/app/lib/metricool/types.ts
apps/app/lib/metricool/client.ts
apps/app/lib/metricool/publish.ts
apps/app/lib/metricool/analytics.ts
apps/app/server/actions/metricool.ts
apps/app/components/metricool-publish-modal.tsx
apps/app/components/metricool-performance-card.tsx
apps/app/app/(dashboard)/analytics/social-performance.tsx
apps/app/app/api/cron/daily/route.ts
supabase/migrations/00023_metricool_posts.sql
supabase/migrations/00024_metricool_analytics.sql
```

- [ ] **Step 3: Check TypeScript types**

Run: `cd apps/app && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Final commit if any loose changes**

```bash
git add -A
git commit -m "chore(metricool): final cleanup and verification"
```
