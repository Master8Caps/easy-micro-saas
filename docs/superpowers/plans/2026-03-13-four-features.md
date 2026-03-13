# Four Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add weekly performance digest email, schedule month view, drag-and-drop scheduling, and mobile-responsive navigation to the marketing platform.

**Architecture:** Four independent features built on the existing Next.js 15 + Supabase + Tailwind stack. Mobile nav is built first since it affects the layout used by all other features. The digest uses Vercel Cron + Resend. Month view extends the existing schedule calendar. Drag-and-drop uses @dnd-kit integrated into both calendar views.

**Tech Stack:** Next.js 15, React 19, Supabase, Tailwind CSS, Resend, @dnd-kit/core, Vercel Cron

**Spec:** `docs/superpowers/specs/2026-03-13-four-features-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `apps/app/app/(dashboard)/layout.tsx` | Modify: simplify to use DashboardShell client wrapper |
| `apps/app/components/dashboard-shell.tsx` | Create: client wrapper with mobile sidebar state, overlay, body scroll lock |
| `apps/app/components/mobile-nav.tsx` | Create: mobile top bar with hamburger button |
| `apps/app/server/actions/email.ts` | Modify: add `buildDigestEmail()` template function |
| `apps/app/server/actions/digest.ts` | Create: digest data queries (per-user stats aggregation) |
| `apps/app/app/api/cron/weekly-digest/route.ts` | Create: cron endpoint handler |
| `apps/app/app/api/digest/unsubscribe/route.ts` | Create: unsubscribe endpoint |
| `vercel.json` | Create: cron schedule config |
| `apps/app/app/(dashboard)/schedule/page.tsx` | Modify: support month view data fetching |
| `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx` | Modify: add view switcher, month grid, DnD integration |
| `apps/app/app/(dashboard)/schedule/month-grid.tsx` | Create: month calendar grid component |
| `apps/app/package.json` | Modify: add @dnd-kit dependencies |

---

## Chunk 1: Mobile Responsive Navigation

### Task 1: Create Mobile Top Bar Component

**Files:**
- Create: `apps/app/components/mobile-nav.tsx`

- [ ] **Step 1: Create the mobile-nav component**

This component renders only below `md` breakpoint. It shows a hamburger icon and the logo.

```tsx
// apps/app/components/mobile-nav.tsx
"use client";

interface MobileNavProps {
  onToggle: () => void;
}

export function MobileNav({ onToggle }: MobileNavProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 md:hidden">
      <button
        onClick={onToggle}
        aria-label="Toggle navigation"
        className="flex h-9 w-9 items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
      <a href="/" className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#logo-grad-mobile)" />
          <path d="M9 16.5L14 21.5L23 10.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="logo-grad-mobile" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#6366f1" />
              <stop offset="0.5" stopColor="#a855f7" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-heading text-sm font-semibold">Easy Micro SaaS</span>
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Verify file created**

Run: `ls apps/app/components/mobile-nav.tsx`
Expected: file exists

---

### Task 2: Make Sidebar Responsive with Overlay

**Files:**
- Modify: `apps/app/app/(dashboard)/layout.tsx`
- Modify: `apps/app/components/sidebar-nav.tsx`

- [ ] **Step 1: Add mobile sidebar wrapper to layout.tsx**

The layout needs to:
- Import `MobileNav`
- Convert the `<aside>` to be hidden on mobile, shown as overlay when toggled
- Add a client wrapper for the sidebar state since layout.tsx is a server component

Create a new client component that wraps the sidebar logic. Add it to `layout.tsx`:

Replace the entire layout.tsx with:

```tsx
// apps/app/app/(dashboard)/layout.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserWithRole, requireAuth } from "@/server/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserProvider } from "@/components/user-context";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const { role, status } = await getUserWithRole();

  if (status === "waitlist") redirect("/waitlist");

  return (
    <UserProvider email={user.email ?? ""} role={role}>
      <DashboardShell email={user.email ?? ""}>
        {children}
      </DashboardShell>
    </UserProvider>
  );
}
```

- [ ] **Step 2: Create DashboardShell client component**

Create `apps/app/components/dashboard-shell.tsx` — this client component handles the mobile sidebar state:

```tsx
// apps/app/components/dashboard-shell.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileNav } from "@/components/mobile-nav";

interface DashboardShellProps {
  email: string;
  children: React.ReactNode;
}

export function DashboardShell({ email, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* Mobile top bar */}
      <MobileNav onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex h-screen">
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col overflow-y-auto
            border-r border-line bg-surface px-4 py-5
            transition-transform duration-200 ease-in-out
            md:relative md:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
              <path
                d="M9 16.5L14 21.5L23 10.5"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="logo-grad"
                  x1="0"
                  y1="0"
                  x2="32"
                  y2="32"
                >
                  <stop stopColor="#6366f1" />
                  <stop offset="0.5" stopColor="#a855f7" />
                  <stop offset="1" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-heading text-sm font-semibold">
              Easy Micro SaaS
            </span>
          </Link>

          {/* Nav */}
          <SidebarNav />

          {/* User footer */}
          <div className="mt-auto border-t border-line px-3 pt-4">
            <p className="truncate text-xs text-content-muted">{email}</p>
            <SignOutButton />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 pt-[56px] md:p-8 md:pt-8">
          {children}
        </main>
      </div>
    </>
  );
}
```

Key details:
- `pt-[56px]` on mobile accounts for the 56px (h-14) fixed mobile top bar
- Sidebar uses `fixed` + `translate-x` for slide-in animation on mobile, `md:relative md:translate-x-0` for desktop
- Backdrop click and route change both close the sidebar
- Body scroll lock prevents background scrolling

- [ ] **Step 3: Verify the build**

Run: `cd apps/app && npx next build 2>&1 | tail -20`
Expected: Build succeeds. Check for TypeScript errors.

- [ ] **Step 4: Manual verification**

1. Open the app in browser at desktop width → sidebar visible as before, no top bar
2. Resize to < 768px → sidebar disappears, hamburger top bar appears
3. Tap hamburger → sidebar slides in from left with backdrop
4. Tap a nav item → navigates and sidebar closes
5. Tap backdrop → sidebar closes
6. Open sidebar + press Escape → closes

- [ ] **Step 5: Commit**

```bash
git add apps/app/components/mobile-nav.tsx apps/app/components/dashboard-shell.tsx apps/app/app/\(dashboard\)/layout.tsx
git commit -m "feat: add mobile responsive navigation with hamburger menu"
```

---

## Chunk 2: Weekly Performance Digest Email

### Task 3: Add Database Migration for Digest Unsubscribe

**Files:**
- Create: `supabase/migrations/00020_digest_unsubscribe.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 00020: Add digest_unsubscribed flag to profiles
ALTER TABLE profiles
  ADD COLUMN digest_unsubscribed boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Apply the migration**

User must apply this via Supabase dashboard or CLI:
`supabase db push` or run the SQL directly in Supabase SQL Editor.

- [ ] **Step 3: Commit**

```bash
git add -f supabase/migrations/00020_digest_unsubscribe.sql
git commit -m "feat: add digest_unsubscribed column to profiles"
```

---

### Task 4: Build Digest Data Queries

**Files:**
- Create: `apps/app/server/actions/digest.ts`

- [ ] **Step 1: Create the digest data query module**

This module queries all the data needed for one user's digest email. It uses the service client (not user-scoped) since the cron runs without user auth.

```ts
// apps/app/server/actions/digest.ts
import { createServiceClient } from "@/lib/supabase/service";

export interface DigestProduct {
  id: string;
  name: string;
  totalClicks: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  topPiece: {
    title: string;
    channel: string;
    compositeScore: number;
  } | null;
}

export interface DigestData {
  email: string;
  totalClicksAllProducts: number;
  postsThisWeek: number;
  topPerformer: { title: string; channel: string; score: number } | null;
  products: DigestProduct[];
  totalProductCount: number;
  actionItems: {
    readyToPost: number;
    scheduledThisWeek: number;
    campaignsWithNoContent: number;
  };
}

/**
 * Compute composite score for a content piece.
 * Matches the formula in learning.ts: 40% clicks + 40% engagement + 20% rating
 */
function compositeScore(piece: {
  rating: number | null;
  engagement_views: number | null;
  engagement_likes: number | null;
  engagement_comments: number | null;
  engagement_shares: number | null;
  clickCount: number;
}): number {
  const clicks = Math.min(piece.clickCount / 50, 1) * 100;
  const eng =
    ((piece.engagement_views || 0) +
      (piece.engagement_likes || 0) * 3 +
      (piece.engagement_comments || 0) * 5 +
      (piece.engagement_shares || 0) * 4) /
    10;
  const engNorm = Math.min(eng, 100);
  const rating = ((piece.rating || 0) / 5) * 100;
  return clicks * 0.4 + engNorm * 0.4 + rating * 0.2;
}

export async function getDigestDataForUser(
  userId: string,
  email: string,
): Promise<DigestData | null> {
  const supabase = createServiceClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoISO = weekAgo.toISOString();
  const nextWeekISO = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Get user's products
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("user_id", userId);

  if (!products || products.length === 0) return null;

  const productIds = products.map((p) => p.id);

  // Get all content pieces for these products with link click counts
  const { data: pieces } = await supabase
    .from("content_pieces")
    .select(
      "id, product_id, title, status, posted_at, scheduled_for, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, campaigns(channel), links(click_count)",
    )
    .in("product_id", productIds)
    .eq("archived", false);

  if (!pieces) return null;

  // Get campaigns with no content
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, content_pieces(id)")
    .in("product_id", productIds)
    .eq("archived", false);

  // Calculate per-product data
  const productMap = new Map<string, DigestProduct>();
  for (const prod of products) {
    productMap.set(prod.id, {
      id: prod.id,
      name: prod.name,
      totalClicks: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      topPiece: null,
    });
  }

  let totalClicksAll = 0;
  let postsThisWeek = 0;
  let globalTop: { title: string; channel: string; score: number } | null =
    null;
  let readyToPost = 0;
  let scheduledThisWeek = 0;

  for (const piece of pieces) {
    const clickCount =
      (piece.links as { click_count: number }[] | null)?.reduce(
        (sum, l) => sum + (l.click_count || 0),
        0,
      ) || 0;
    const prodData = productMap.get(piece.product_id);
    if (!prodData) continue;

    prodData.totalClicks += clickCount;
    prodData.totalViews += piece.engagement_views || 0;
    prodData.totalLikes += piece.engagement_likes || 0;
    prodData.totalComments += piece.engagement_comments || 0;
    prodData.totalShares += piece.engagement_shares || 0;
    totalClicksAll += clickCount;

    // Posted this week?
    if (piece.posted_at && piece.posted_at >= weekAgoISO) {
      postsThisWeek++;
    }

    // Ready to post (approved but not posted)
    if (piece.status === "approved") {
      readyToPost++;
    }

    // Scheduled this week
    if (
      piece.scheduled_for &&
      piece.scheduled_for >= now.toISOString() &&
      piece.scheduled_for <= nextWeekISO
    ) {
      scheduledThisWeek++;
    }

    // Composite score for ranking
    const score = compositeScore({ ...piece, clickCount });
    const channel =
      (piece.campaigns as { channel: string } | null)?.channel || "unknown";

    if (!prodData.topPiece || score > prodData.topPiece.compositeScore) {
      prodData.topPiece = {
        title: piece.title || "Untitled",
        channel,
        compositeScore: score,
      };
    }

    if (!globalTop || score > globalTop.score) {
      globalTop = {
        title: piece.title || "Untitled",
        channel,
        score,
      };
    }
  }

  // Campaigns with no content
  const campaignsNoContent =
    campaigns?.filter(
      (c) =>
        !c.content_pieces || (c.content_pieces as { id: string }[]).length === 0,
    ).length || 0;

  // Filter out products with zero activity
  const activeProducts = Array.from(productMap.values()).filter(
    (p) =>
      p.totalClicks > 0 ||
      p.totalViews > 0 ||
      p.totalLikes > 0 ||
      p.topPiece !== null,
  );
  const totalProductCount = activeProducts.length;

  // If absolutely nothing happened, skip this user
  if (
    totalClicksAll === 0 &&
    postsThisWeek === 0 &&
    readyToPost === 0 &&
    scheduledThisWeek === 0 &&
    activeProducts.length === 0 &&
    campaignsNoContent === 0
  ) {
    return null;
  }

  return {
    email,
    totalClicksAllProducts: totalClicksAll,
    postsThisWeek,
    topPerformer: globalTop,
    products: activeProducts.slice(0, 5),
    totalProductCount,
    actionItems: {
      readyToPost,
      scheduledThisWeek,
      campaignsWithNoContent: campaignsNoContent,
    },
  };
}
```

- [ ] **Step 2: Verify the build**

Run: `cd apps/app && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors in digest.ts

- [ ] **Step 3: Commit**

```bash
git add apps/app/server/actions/digest.ts
git commit -m "feat: add digest data query module"
```

---

### Task 5: Build Digest Email Template

**Files:**
- Modify: `apps/app/server/actions/email.ts`

- [ ] **Step 1: Add the digest email builder to email.ts**

Add the following functions after the existing `sendActivationEmail` function:

```ts
// Add this import at the top of email.ts
import type { DigestData } from "./digest";

export function buildDigestEmail(data: DigestData): string {
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.easymicrosaas.com";

  // --- Ingredient 1: Dashboard Header ---
  const header = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:20px;background-color:#1e1b4b;border-radius:10px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#e0e7ff;">Weekly Performance Digest</h1>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:8px;">
                <p style="margin:0;font-size:24px;font-weight:bold;color:#818cf8;">${data.totalClicksAllProducts}</p>
                <p style="margin:4px 0 0;font-size:11px;color:#a5b4fc;">Total Clicks</p>
              </td>
              <td align="center" style="padding:8px;">
                <p style="margin:0;font-size:24px;font-weight:bold;color:#818cf8;">${data.postsThisWeek}</p>
                <p style="margin:4px 0 0;font-size:11px;color:#a5b4fc;">Posted This Week</p>
              </td>
            </tr>
          </table>
          ${
            data.topPerformer
              ? `<p style="margin:12px 0 0;font-size:12px;color:#a5b4fc;">Top performer: <strong style="color:#e0e7ff;">${data.topPerformer.title}</strong> (${data.topPerformer.channel})</p>`
              : ""
          }
        </td>
      </tr>
    </table>
  `;

  // --- Ingredient 2: Per-Product Cards ---
  let productCards = "";
  if (data.products.length > 0) {
    const cards = data.products
      .map(
        (p) => `
      <tr>
        <td style="padding:12px 16px;background-color:#27272a;border-radius:8px;margin-bottom:8px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#f4f4f5;">${p.name}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px;color:#a1a1aa;">Clicks: <strong style="color:#f4f4f5;">${p.totalClicks}</strong></td>
              <td style="font-size:11px;color:#a1a1aa;">Views: <strong style="color:#f4f4f5;">${p.totalViews}</strong></td>
              <td style="font-size:11px;color:#a1a1aa;">Likes: <strong style="color:#f4f4f5;">${p.totalLikes}</strong></td>
            </tr>
          </table>
          ${
            p.topPiece
              ? `<p style="margin:8px 0 0;font-size:11px;color:#71717a;">Best: <span style="color:#a5b4fc;">${p.topPiece.title}</span> (${p.topPiece.channel})</p>`
              : ""
          }
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
    `,
      )
      .join("");

    const moreProducts =
      data.totalProductCount > 5
        ? `<tr><td style="padding:8px 0;text-align:center;font-size:12px;color:#71717a;">and ${data.totalProductCount - 5} more product${data.totalProductCount - 5 === 1 ? "" : "s"}</td></tr>`
        : "";

    productCards = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td>
            <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.05em;">Your Products</h2>
          </td>
        </tr>
        ${cards}
        ${moreProducts}
      </table>
    `;
  }

  // --- Ingredient 3: Action Items ---
  const actions: string[] = [];
  if (data.actionItems.readyToPost > 0)
    actions.push(
      `<li style="margin-bottom:6px;"><span style="color:#34d399;">&#10003;</span> <strong>${data.actionItems.readyToPost}</strong> piece${data.actionItems.readyToPost === 1 ? "" : "s"} ready to post</li>`,
    );
  if (data.actionItems.scheduledThisWeek > 0)
    actions.push(
      `<li style="margin-bottom:6px;"><span style="color:#818cf8;">&#9650;</span> <strong>${data.actionItems.scheduledThisWeek}</strong> scheduled this week</li>`,
    );
  if (data.actionItems.campaignsWithNoContent > 0)
    actions.push(
      `<li style="margin-bottom:6px;"><span style="color:#fbbf24;">&#9679;</span> <strong>${data.actionItems.campaignsWithNoContent}</strong> campaign${data.actionItems.campaignsWithNoContent === 1 ? "" : "s"} with no content yet</li>`,
    );

  const actionSection =
    actions.length > 0
      ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.05em;">Action Items</h2>
          <ul style="margin:0;padding-left:16px;color:#d4d4d8;font-size:13px;list-style:none;">
            ${actions.join("")}
          </ul>
        </td>
      </tr>
    </table>
  `
      : "";

  // --- CTA Button ---
  const cta = `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-top:8px;">
          <a href="${APP_URL}" style="display:inline-block;padding:10px 24px;background-color:#6366f1;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
            Open Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  return emailWrapper(header + productCards + actionSection + cta);
}

// Note: emailWrapper is a local function already defined in this same file (email.ts).
// The DigestData type is imported from "./digest".
```

- [ ] **Step 2: Verify the build**

Run: `cd apps/app && npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add apps/app/server/actions/email.ts
git commit -m "feat: add weekly digest email template"
```

---

### Task 6: Create Cron Endpoint and Unsubscribe Route

**Files:**
- Create: `apps/app/app/api/cron/weekly-digest/route.ts`
- Create: `apps/app/app/api/digest/unsubscribe/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Create the cron route handler**

```ts
// apps/app/app/api/cron/weekly-digest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { getDigestDataForUser } from "@/server/actions/digest";
import { buildDigestEmail } from "@/server/actions/email";

export const maxDuration = 300; // 5 minutes for processing all users

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const resend = getResend();

  // Get all users who haven't unsubscribed
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("digest_unsubscribed", false);

  if (error || !profiles) {
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 },
    );
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE);

    for (const profile of batch) {
      try {
        // Get email from auth.users via service client
        const {
          data: { user },
        } = await supabase.auth.admin.getUserById(profile.id);
        if (!user?.email) {
          skipped++;
          continue;
        }

        const digestData = await getDigestDataForUser(profile.id, user.email);
        if (!digestData) {
          skipped++;
          continue;
        }

        const html = buildDigestEmail(digestData);
        const APP_URL =
          process.env.NEXT_PUBLIC_APP_URL || "https://app.easymicrosaas.com";

        await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: "Your Weekly Marketing Digest — Easy Micro SaaS",
          html:
            html +
            `<p style="text-align:center;margin-top:16px;font-size:11px;color:#52525b;"><a href="${APP_URL}/api/digest/unsubscribe?uid=${profile.id}" style="color:#71717a;">Unsubscribe from digest emails</a></p>`,
        });
        sent++;
      } catch (err) {
        console.error(
          `Digest email failed for user ${profile.id}:`,
          err,
        );
        errors++;
      }
    }

    // Small delay between batches
    if (i + BATCH_SIZE < profiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json({ sent, skipped, errors });
}
```

- [ ] **Step 2: Create the unsubscribe route**

```ts
// apps/app/app/api/digest/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return new NextResponse("Missing user ID", { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({ digest_unsubscribed: true })
    .eq("id", uid);

  if (error) {
    return new NextResponse("Failed to unsubscribe", { status: 500 });
  }

  return new NextResponse(
    `<html>
      <body style="background:#09090b;color:#f4f4f5;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="text-align:center;">
          <h1 style="font-size:20px;margin-bottom:8px;">Unsubscribed</h1>
          <p style="color:#71717a;">You won't receive weekly digest emails anymore.</p>
        </div>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}
```

- [ ] **Step 3: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

This runs every Monday at 9:00 AM UTC.

- [ ] **Step 4: Verify the build**

Run: `cd apps/app && npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors

Note: The cron endpoint uses `supabase.auth.admin.getUserById()` which requires the service role client. Verify `createServiceClient` is set up with the service role key.

- [ ] **Step 5: Commit**

```bash
git add apps/app/app/api/cron/weekly-digest/route.ts apps/app/app/api/digest/unsubscribe/route.ts vercel.json
git commit -m "feat: add weekly digest cron endpoint and unsubscribe route"
```

---

## Chunk 3: Schedule Month View

### Task 7: Add Month View to Schedule Page

**Files:**
- Modify: `apps/app/app/(dashboard)/schedule/page.tsx`
- Create: `apps/app/app/(dashboard)/schedule/month-grid.tsx`
- Modify: `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx`

- [ ] **Step 1: Update page.tsx to support view and month params**

Replace the full page.tsx with:

```tsx
// apps/app/app/(dashboard)/schedule/page.tsx
import { createClient } from "@/lib/supabase/server";
import { ScheduleCalendar } from "./schedule-calendar";

export const maxDuration = 60;

function getWeekRange(weekOffset: number) {
  const now = new Date();
  const currentDay = now.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    startDate: monday.toISOString(),
    endDate: sunday.toISOString(),
  };
}

function getMonthRange(monthParam: string | undefined) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  if (monthParam) {
    const [y, m] = monthParam.split("-").map(Number);
    if (y && m) {
      year = y;
      month = m - 1;
    }
  }

  // First day of month
  const first = new Date(year, month, 1);
  // Last day of month
  const last = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Extend to full weeks (Monday start)
  const firstDay = first.getDay();
  const mondayOffset = firstDay === 0 ? -6 : 1 - firstDay;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() + mondayOffset);

  const lastDay = last.getDay();
  const sundayOffset = lastDay === 0 ? 0 : 7 - lastDay;
  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + sundayOffset);
  gridEnd.setHours(23, 59, 59, 999);

  return {
    startDate: gridStart.toISOString(),
    endDate: gridEnd.toISOString(),
    year,
    month: month + 1, // 1-indexed for display
  };
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; view?: string; month?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "month" ? "month" : "week";
  const weekOffset = parseInt(params.week || "0", 10) || 0;

  // Get the date range based on view
  const range =
    view === "month"
      ? getMonthRange(params.month)
      : getWeekRange(weekOffset);

  const supabase = await createClient();

  const { data: scheduledPieces } = await supabase
    .from("content_pieces")
    .select(
      "id, product_id, campaign_id, type, title, body, status, posted_at, scheduled_for, archived, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at, image_url, image_source, image_prompt_used, products(name), campaigns(channel, angle)",
    )
    .gte("scheduled_for", range.startDate)
    .lte("scheduled_for", range.endDate)
    .eq("archived", false)
    .order("scheduled_for", { ascending: true });

  const { data: unscheduledPieces } = await supabase
    .from("content_pieces")
    .select(
      "id, product_id, campaign_id, type, title, body, status, posted_at, scheduled_for, archived, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at, image_url, image_source, image_prompt_used, products(name), campaigns(channel, angle)",
    )
    .is("scheduled_for", null)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .order("name");

  const monthInfo =
    view === "month"
      ? { year: (range as any).year, month: (range as any).month }
      : undefined;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="mt-1 text-sm text-content-muted">
          Plan and organise your content calendar.
        </p>
      </div>

      <ScheduleCalendar
        scheduledPieces={(scheduledPieces ?? []) as any}
        unscheduledPieces={(unscheduledPieces ?? []) as any}
        products={(products ?? []) as { id: string; name: string }[]}
        weekOffset={weekOffset}
        view={view}
        monthInfo={monthInfo}
      />
    </>
  );
}
```

- [ ] **Step 2: Create the month-grid component**

```tsx
// apps/app/app/(dashboard)/schedule/month-grid.tsx
"use client";

interface MonthPiece {
  id: string;
  scheduled_for: string | null;
  status: string;
}

interface MonthGridProps {
  pieces: MonthPiece[];
  year: number;
  month: number; // 1-indexed
  onDayClick: (dateISO: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  posted: "bg-emerald-400",
  scheduled: "bg-violet-400",
  approved: "bg-blue-400",
  draft: "bg-amber-400",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthGrid({ pieces, year, month, onDayClick }: MonthGridProps) {
  // Build the grid of days
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);

  // Pad to full weeks (Monday start)
  const firstDay = firstOfMonth.getDay();
  const mondayOffset = firstDay === 0 ? -6 : 1 - firstDay;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() + mondayOffset);

  const lastDay = lastOfMonth.getDay();
  const sundayOffset = lastDay === 0 ? 0 : 7 - lastDay;
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(lastOfMonth.getDate() + sundayOffset);

  // Generate all days in the grid
  const days: Date[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // Group pieces by date string
  const piecesByDate = new Map<string, MonthPiece[]>();
  for (const piece of pieces) {
    if (!piece.scheduled_for) continue;
    const dateKey = piece.scheduled_for.slice(0, 10);
    const arr = piecesByDate.get(dateKey) || [];
    arr.push(piece);
    piecesByDate.set(dateKey, arr);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div>
      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-xs font-medium text-content-muted"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const isCurrentMonth = day.getMonth() === month - 1;
          const isToday = dateStr === todayStr;
          const dayPieces = piecesByDate.get(dateStr) || [];

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                flex min-h-[72px] flex-col rounded-lg border p-2 text-left transition-colors hover:bg-surface-hover
                ${isToday ? "border-indigo-500/40 bg-indigo-500/5" : "border-line"}
                ${!isCurrentMonth ? "opacity-40" : ""}
              `}
            >
              <span
                className={`text-xs font-medium ${isToday ? "text-indigo-400" : "text-content-muted"}`}
              >
                {day.getDate()}
              </span>

              {dayPieces.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {dayPieces.slice(0, 4).map((p) => (
                    <span
                      key={p.id}
                      className={`h-2 w-2 rounded-full ${STATUS_COLORS[p.status] || "bg-zinc-400"}`}
                    />
                  ))}
                  {dayPieces.length > 4 && (
                    <span className="text-[10px] text-content-muted">
                      +{dayPieces.length - 4}
                    </span>
                  )}
                </div>
              )}

              {dayPieces.length > 0 && (
                <span className="mt-auto text-[10px] text-content-muted">
                  {dayPieces.length} piece{dayPieces.length !== 1 ? "s" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add view switcher and month navigation to schedule-calendar.tsx**

At the top of `schedule-calendar.tsx`, add the import:

```tsx
import { MonthGrid } from "./month-grid";
```

Update the `ScheduleCalendar` component props interface and function signature to accept new props:

```tsx
interface ScheduleCalendarProps {
  scheduledPieces: SchedulePiece[];
  unscheduledPieces: SchedulePiece[];
  products: { id: string; name: string }[];
  weekOffset: number;
  view: "week" | "month";
  monthInfo?: { year: number; month: number };
}

export function ScheduleCalendar({
  scheduledPieces: initialScheduled,
  unscheduledPieces: initialUnscheduled,
  products,
  weekOffset,
  view,
  monthInfo,
}: ScheduleCalendarProps) {
```

Add the view switcher and month navigation in the JSX. Place the view switcher right before the existing week navigation section:

```tsx
{/* View Switcher */}
<div className="mb-4 flex items-center gap-2">
  <div className="inline-flex rounded-lg border border-line">
    <button
      onClick={() => {
        // Preserve date context: if in month view, switch to a week within that month
        if (view === "month" && monthInfo) {
          const target = new Date(monthInfo.year, monthInfo.month - 1, 15);
          const now = new Date();
          const diffDays = Math.round((target.getTime() - now.getTime()) / (86400000 * 7));
          router.push(`/schedule?view=week&week=${diffDays}`);
        } else {
          router.push("/schedule?view=week");
        }
      }}
      className={`rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        view === "week"
          ? "bg-indigo-500 text-white"
          : "text-content-muted hover:text-content"
      }`}
    >
      Week
    </button>
    <button
      onClick={() => {
        // Preserve date context: if in week view, switch to that week's month
        if (view === "week") {
          const days = getWeekDays(weekOffset);
          const mid = days[3]; // Wednesday of current week
          const d = new Date(mid.dateISO);
          router.push(`/schedule?view=month&month=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        } else {
          router.push("/schedule?view=month");
        }
      }}
      className={`rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        view === "month"
          ? "bg-indigo-500 text-white"
          : "text-content-muted hover:text-content"
      }`}
    >
      Month
    </button>
  </div>
</div>
```

Add month navigation and grid rendering. After the view switcher, conditionally render either the week view or month view:

```tsx
{view === "month" && monthInfo ? (
  <>
    {/* Month navigation */}
    <div className="mb-4 flex items-center gap-3">
      <button
        onClick={() => {
          const prev = new Date(monthInfo.year, monthInfo.month - 2, 1);
          router.push(
            `/schedule?view=month&month=${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`,
          );
        }}
        className="rounded-md border border-line px-2 py-1 text-xs text-content-muted hover:text-content"
      >
        &larr; Prev
      </button>
      <h2 className="text-sm font-semibold">
        {new Date(monthInfo.year, monthInfo.month - 1).toLocaleDateString(
          "en-US",
          { month: "long", year: "numeric" },
        )}
      </h2>
      <button
        onClick={() => {
          const next = new Date(monthInfo.year, monthInfo.month, 1);
          router.push(
            `/schedule?view=month&month=${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
          );
        }}
        className="rounded-md border border-line px-2 py-1 text-xs text-content-muted hover:text-content"
      >
        Next &rarr;
      </button>
      <button
        onClick={() => router.push("/schedule?view=month")}
        className="text-xs text-indigo-400 hover:text-indigo-300"
      >
        This month
      </button>
    </div>

    {/* Month grid */}
    <MonthGrid
      pieces={scheduled}
      year={monthInfo.year}
      month={monthInfo.month}
      onDayClick={(dateISO) => {
        // Find first piece on that day and select it, or just show panel for that day
        const dayPiece = scheduled.find(
          (p) => p.scheduled_for?.startsWith(dateISO),
        );
        if (dayPiece) setSelectedPiece(dayPiece);
      }}
    />
  </>
) : (
  /* existing week view JSX stays here - no changes needed */
)}
```

Wrap the existing week navigation + 7-day grid + everything before the unscheduled section inside the `else` branch of this conditional.

- [ ] **Step 4: Verify the build**

Run: `cd apps/app && npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 5: Manual verification**

1. Navigate to `/schedule` → week view shows (default)
2. Click "Month" toggle → month grid renders with current month
3. Navigate prev/next month → URL updates, grid shows correct month
4. Click "This month" → returns to current month
5. Days with scheduled content show colored dots
6. Click a day with content → side panel opens
7. Switch back to "Week" → week view shows
8. Today's date is highlighted in month view

- [ ] **Step 6: Commit**

```bash
git add apps/app/app/\(dashboard\)/schedule/page.tsx apps/app/app/\(dashboard\)/schedule/month-grid.tsx apps/app/app/\(dashboard\)/schedule/schedule-calendar.tsx
git commit -m "feat: add month view to schedule calendar with view switcher"
```

---

## Chunk 4: Drag-and-Drop Scheduling

### Task 8: Install @dnd-kit Dependencies

**Files:**
- Modify: `apps/app/package.json`

- [ ] **Step 1: Install packages**

```bash
cd apps/app && pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Commit**

```bash
git add apps/app/package.json pnpm-lock.yaml
git commit -m "chore: add @dnd-kit dependencies for drag-and-drop scheduling"
```

---

### Task 9: Integrate Drag-and-Drop into Schedule Calendar

**Files:**
- Modify: `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx`

This is the largest task. We need to:
1. Wrap the calendar in a DndContext
2. Make calendar cards and unscheduled cards draggable
3. Make day columns and the unscheduled pool droppable
4. Handle the drop event with optimistic updates

**Important context:** `schedule-calendar.tsx` is a ~560-line file. Read it fully before modifying. Key facts: `updateContentPieceSchedule` is already imported. The component uses `useRouter` from Next navigation. The `CalendarCard` sub-component is rendered inside a `.map()` over `dayPieces` within the 7-day grid. The `UnscheduledCard` sub-component is rendered in a separate section below the grid. The unscheduled pool is a `<div>` after the grid section.

- [ ] **Step 1: Add DnD imports and context to schedule-calendar.tsx**

Add these imports at the top (alongside existing imports):

```tsx
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
```

- [ ] **Step 2: Create Draggable and Droppable wrapper components**

Add these helper components inside the file, before the main `ScheduleCalendar` component:

```tsx
function DraggableCard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? "opacity-30" : ""}
      style={{ touchAction: "none" }}
    >
      {children}
    </div>
  );
}

function DroppableZone({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className || ""} ${isOver ? "ring-2 ring-indigo-500/50" : ""}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Add DnD state and handlers to ScheduleCalendar**

Inside the `ScheduleCalendar` component, add:

```tsx
// DnD state
const [activeDragId, setActiveDragId] = useState<string | null>(null);

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  }),
);

const activePiece = activeDragId
  ? [...scheduled, ...unscheduled].find((p) => p.id === activeDragId)
  : null;

function handleDragStart(event: DragStartEvent) {
  setActiveDragId(event.active.id as string);
}

async function handleDragEnd(event: DragEndEvent) {
  setActiveDragId(null);
  const { active, over } = event;
  if (!over) return;

  const pieceId = active.id as string;
  const targetId = over.id as string;

  // Determine the new scheduled date
  let newDate: string | null = null;
  if (targetId === "unscheduled-pool") {
    newDate = null;
  } else if (targetId.startsWith("day-")) {
    newDate = targetId.replace("day-", "");
  } else {
    return; // Unknown drop target
  }

  // Find the piece
  const piece =
    scheduled.find((p) => p.id === pieceId) ||
    unscheduled.find((p) => p.id === pieceId);
  if (!piece) return;

  // Check if actually changing
  const currentDate = piece.scheduled_for?.slice(0, 10) || null;
  if (currentDate === newDate) return;

  // Optimistic update
  if (newDate) {
    // Scheduling or rescheduling
    const updatedPiece = {
      ...piece,
      scheduled_for: newDate + "T09:00:00",
      status: "scheduled" as const,
    };
    setScheduled((prev) => [
      ...prev.filter((p) => p.id !== pieceId),
      updatedPiece,
    ]);
    setUnscheduled((prev) => prev.filter((p) => p.id !== pieceId));
  } else {
    // Unscheduling
    const updatedPiece = {
      ...piece,
      scheduled_for: null,
      status: "approved" as const,
    };
    setUnscheduled((prev) => [updatedPiece, ...prev]);
    setScheduled((prev) => prev.filter((p) => p.id !== pieceId));
  }

  // Fire server action
  const result = await updateContentPieceSchedule(
    pieceId,
    newDate ? newDate + "T09:00:00" : null,
  );

  if (result.error) {
    // Revert on failure — reload page to get fresh state
    console.error("Schedule update failed:", result.error);
    router.refresh();
  }
}
```

- [ ] **Step 4: Wrap the calendar JSX in DndContext**

Wrap the entire return JSX of `ScheduleCalendar` in:

```tsx
return (
  <DndContext
    sensors={sensors}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
  >
    {/* ... existing JSX ... */}

    {/* Drag overlay — floating card that follows cursor */}
    <DragOverlay>
      {activePiece ? (
        <div className="w-48 rounded-lg border border-indigo-500/50 bg-surface p-2 shadow-lg">
          <p className="truncate text-xs font-medium">{activePiece.title}</p>
          <p className="truncate text-[10px] text-content-muted">
            {(activePiece.campaigns as any)?.channel}
          </p>
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>
);
```

- [ ] **Step 5: Wrap day columns with DroppableZone**

In the week view's 7-day grid, wrap each day column:

Change the day column `<div>` to:
```tsx
<DroppableZone key={day.dateISO} id={`day-${day.dateISO}`} className="...existing classes...">
  {/* ... existing day content ... */}
</DroppableZone>
```

In the month grid, update `MonthGrid` to also accept droppable functionality. Modify `month-grid.tsx` to wrap each day cell button in a DroppableZone — or more practically, just add the `day-{dateStr}` droppable IDs to the month grid. The simplest approach: pass the droppable IDs through and have the `MonthGrid` component import and use `useDroppable` directly on each day cell.

Update `month-grid.tsx` to add droppable support:

```tsx
// Add import at top of month-grid.tsx
import { useDroppable } from "@dnd-kit/core";

// Replace the day button render with:
function DayCell({
  dateStr,
  isCurrentMonth,
  isToday,
  dayPieces,
  dayNumber,
  onDayClick,
}: {
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayPieces: MonthPiece[];
  dayNumber: number;
  onDayClick: (dateISO: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `day-${dateStr}` });

  return (
    <button
      ref={setNodeRef}
      onClick={() => onDayClick(dateStr)}
      className={`
        flex min-h-[72px] flex-col rounded-lg border p-2 text-left transition-colors hover:bg-surface-hover
        ${isToday ? "border-indigo-500/40 bg-indigo-500/5" : "border-line"}
        ${!isCurrentMonth ? "opacity-40" : ""}
        ${isOver ? "ring-2 ring-indigo-500/50" : ""}
      `}
    >
      <span
        className={`text-xs font-medium ${isToday ? "text-indigo-400" : "text-content-muted"}`}
      >
        {dayNumber}
      </span>

      {dayPieces.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {dayPieces.slice(0, 4).map((p) => (
            <span
              key={p.id}
              className={`h-2 w-2 rounded-full ${STATUS_COLORS[p.status] || "bg-zinc-400"}`}
            />
          ))}
          {dayPieces.length > 4 && (
            <span className="text-[10px] text-content-muted">
              +{dayPieces.length - 4}
            </span>
          )}
        </div>
      )}

      {dayPieces.length > 0 && (
        <span className="mt-auto text-[10px] text-content-muted">
          {dayPieces.length} piece{dayPieces.length !== 1 ? "s" : ""}
        </span>
      )}
    </button>
  );
}
```

Update the MonthGrid render to use `DayCell` instead of inline button.

- [ ] **Step 6: Wrap existing CalendarCard and UnscheduledCard in DraggableCard**

In the week view grid where `CalendarCard` is rendered, wrap each one:
```tsx
<DraggableCard key={piece.id} id={piece.id}>
  <CalendarCard piece={piece} onClick={() => setSelectedPiece(piece)} />
</DraggableCard>
```

In the unscheduled pool where `UnscheduledCard` is rendered, wrap each one:
```tsx
<DraggableCard key={piece.id} id={piece.id}>
  <UnscheduledCard piece={piece} ... />
</DraggableCard>
```

Wrap the unscheduled pool container in a DroppableZone:
```tsx
<DroppableZone id="unscheduled-pool" className="...existing classes...">
  {/* ... unscheduled cards ... */}
</DroppableZone>
```

- [ ] **Step 7: Verify the build**

Run: `cd apps/app && npx tsc --noEmit 2>&1 | head -20`
Expected: No type errors

Run: `cd apps/app && npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 8: Manual verification**

1. Week view: drag a card from one day to another → card moves, page doesn't reload
2. Drag from unscheduled pool → day column → piece appears in that day
3. Drag from day column → unscheduled pool → piece unscheduled
4. Month view: drag from unscheduled → day cell → dot appears
5. Drop on same position → no action (no unnecessary server call)
6. Check network tab: server action fires on drop
7. Refresh page after drag → data persists

- [ ] **Step 9: Commit**

```bash
git add apps/app/package.json pnpm-lock.yaml apps/app/app/\(dashboard\)/schedule/schedule-calendar.tsx apps/app/app/\(dashboard\)/schedule/month-grid.tsx
git commit -m "feat: add drag-and-drop scheduling with @dnd-kit"
```

---

## Final Verification

- [ ] **Step 1: Full build check**

```bash
pnpm build --filter=@repo/app
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run typecheck**

```bash
cd apps/app && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Manual smoke test all 4 features**

1. **Mobile nav:** Resize browser < 768px → hamburger appears, sidebar toggles, nav works
2. **Month view:** `/schedule?view=month` → calendar grid renders, day click works, navigation works
3. **Drag-and-drop:** Drag pieces between days, to/from unscheduled pool in both views
4. **Digest:** (Cannot fully test locally without cron) — verify build includes the API route, manually hit `/api/cron/weekly-digest` with auth header to test

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues from smoke testing"
```
