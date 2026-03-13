# Four Features Design: Digest, Month View, Drag-Drop, Mobile Nav

_2026-03-13_

---

## Goal

Implement four independent features in a single development cycle: weekly performance digest email, schedule month view, drag-and-drop scheduling, and mobile-responsive navigation.

---

## Feature 1: Weekly Performance Digest Email

### Purpose

Send a weekly email to each active user summarizing their marketing performance and nudging them toward next actions. Triggered automatically via cron.

### Email Structure — "Three Ingredients"

**Ingredient 1 — Dashboard Header:**
- Total clicks across all products this week
- Number of pieces posted this week
- Top performing piece (by composite score) with title + channel

**Ingredient 2 — Per-Product Cards:**
- For each product with activity:
  - Product name
  - Best performing content piece (title, channel, composite score)
  - Engagement summary: total views, likes, comments, shares
  - Click count from tracked links
- Skip products with zero activity

**Ingredient 3 — Action Items:**
- "X pieces ready to post" (status = approved but not posted)
- "Y pieces scheduled this week" (scheduled_for within next 7 days)
- "Z campaigns with no content yet" (campaigns with 0 content_pieces)

### Technical Approach

**Email rendering:** Server-side HTML template using the same dark-theme style as existing emails in `server/actions/email.ts` (bg: `#09090b`, cards: `#18181b`, responsive HTML tables).

**Trigger:** Vercel Cron Job hitting an API route (e.g. `app/api/cron/weekly-digest/route.ts`).
- Schedule: Every Monday at 9:00 AM UTC
- Vercel cron config in `vercel.json`: `"crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }]`

**Data queries (per user):**
- All products for the user
- Content pieces with `posted_at` within the last 7 days
- Content pieces with engagement data (views, likes, comments, shares)
- Links with click counts from the last 7 days
- Scheduled pieces for the coming week
- Approved-but-unposted pieces
- Campaigns with zero content pieces

**Auth for cron:** Verify a `CRON_SECRET` header to prevent unauthorized access to the endpoint. Set secret in Vercel env vars.

**Sending:** Use existing Resend client from `lib/resend.ts`. Send one email per active user (users with at least one product). From: `Easy Micro SaaS <hello@easymicrosaas.com>`.

**Skip conditions:**
- User has no products → skip
- User has zero activity across all products (no clicks, no engagement, no content) → skip (don't send empty emails)
- User has `digest_unsubscribed = true` in profiles → skip (v1 includes a simple unsubscribe link that sets this flag)

**Batching:** Process users in batches of 50 with a small delay between batches to avoid Vercel function timeout and Resend rate limits. Log failures per-user and continue.

### Edge Cases

- New user with products but no content yet → include only action items ("0 campaigns with content, get started!")
- User with many products → cap at 5 product cards, add "and X more products" link
- Cron runs but Resend fails for one user → log error, continue sending to remaining users (don't fail batch)

---

## Feature 2: Schedule Page — Month View

### Purpose

Add a traditional calendar month view alongside the existing week view, giving users a high-level overview of their content schedule.

### UI Design

**View switcher:** Two buttons (Week | Month) above the calendar grid, next to the existing navigation arrows. Active view highlighted. Default remains week view. View preference stored in URL query param (`?view=month`).

**Month grid:** 7 columns (Mon–Sun) × 4–6 rows depending on month. Standard calendar layout:
- Day cells show: day number, colored status dots (same colors as week view: amber=draft, blue=approved, violet=scheduled, emerald=posted), piece count badge if >0
- Current day highlighted with accent border/background
- Days outside the current month shown but dimmed
- Click a day → open the existing detail side panel filtered to that day's pieces

**Navigation:** Previous/next month arrows, "Today" button (same pattern as week view). URL param: `?view=month&month=2026-03` format.

### Technical Approach

**Data fetching:** Same pattern as week view but for the full month range. Server component fetches all pieces where `scheduled_for` falls within the displayed month (including overflow days from adjacent months visible in the grid).

**Component structure:**
- `schedule-calendar.tsx` gains a `view` prop (`"week" | "month"`)
- Month grid rendered as a separate section within the same component, sharing the side panel and piece rendering logic
- Day cell component shared between views where possible

**Month calculation:** First day of month, last day of month, pad to full weeks (Monday start). Standard date math.

### Edge Cases

- Month with 6 rows (e.g. month starts on Sunday) → render 6 rows
- Day with many pieces → show count badge + first 2-3 dots, rest accessible via click
- Navigating between views preserves approximate date context (viewing March in month → switch to week → shows a March week)

---

## Feature 3: Drag-and-Drop Scheduling

### Purpose

Allow users to schedule, reschedule, and unschedule content pieces by dragging them on the calendar.

### Interactions

1. **Drag from unscheduled pool → calendar day:** Schedules the piece for that date
2. **Drag between calendar days:** Reschedules to the new date
3. **Drag from calendar → unscheduled pool:** Removes the scheduled date (unschedules)

All three interactions call the existing `updateContentPieceSchedule(pieceId, date | null)` server action.

### Library

`@dnd-kit/core` + `@dnd-kit/sortable` — lightweight, accessible, React 19 compatible, good touch support (important for mobile later).

### Technical Approach

**Draggable items:** Each content piece card (in both week view and unscheduled sidebar) becomes a draggable.

**Drop targets:**
- Each day column/cell in the calendar grid is a droppable zone
- The unscheduled pool sidebar is a droppable zone (for unscheduling)

**Drag overlay:** Show a semi-transparent copy of the piece card following the cursor during drag. Original card dims in place.

**Drop feedback:** Target day highlights with accent border/background when a draggable hovers over it.

**Optimistic update:** Move the card immediately on drop, fire the server action in the background. If the action fails, revert the card position and show an error toast.

**Works in both views:** Week view has larger day columns (easy drop targets). Month view has smaller cells but still droppable — the piece moves to that date.

### Edge Cases

- Drag a piece that's already "posted" status → allow it (user might want to re-date for record-keeping)
- Server action fails after optimistic update → revert card to original position, show error message
- Multiple rapid drags → debounce/queue server calls, process sequentially
- Touch devices → `@dnd-kit` handles touch via `PointerSensor` and `TouchSensor` out of the box

---

## Feature 4: Mobile Responsive Navigation

### Purpose

Make the app navigable on mobile devices by converting the fixed sidebar into a collapsible hamburger menu.

### Breakpoint

`md` (768px) — below this, mobile layout activates.

### UI Changes

**Mobile top bar** (visible below `md`):
- Fixed at top of screen
- Contains: hamburger icon (left), "Easy Micro SaaS" logo/text (center or left of center)
- Same background as current sidebar

**Sidebar behavior below `md`:**
- Hidden by default
- Hamburger tap → sidebar slides in from left as an overlay (full height, `w-60` same as desktop)
- Semi-transparent backdrop behind sidebar
- Tap nav item → navigate + close sidebar
- Tap backdrop → close sidebar
- Escape key → close sidebar

**Desktop (≥ `md`):**
- No change — sidebar remains fixed and visible as today

**Content area adjustments:**
- `p-8` → `p-4 md:p-8` (tighter padding on mobile)
- No other page-level changes — complex pages (schedule grid, analytics charts) remain as-is with horizontal scroll if needed

### Technical Approach

**Component changes:**
- `sidebar-nav.tsx` — add state for open/close, hamburger button, backdrop overlay, transition animation (CSS transform or Tailwind classes)
- `layout.tsx` — wrap sidebar in responsive container, add mobile top bar

**State management:** Local `useState` in the layout or sidebar component. No global state needed.

**Animation:** CSS transition on `transform: translateX(-100%)` → `translateX(0)` for slide-in. Backdrop fades in with opacity transition.

**Body scroll lock:** When sidebar is open on mobile, prevent background scrolling (set `overflow: hidden` on body).

### Edge Cases

- User resizes browser from mobile to desktop → sidebar should reappear automatically (CSS handles this via `md:` classes, no JS needed)
- Route change while sidebar is open → close sidebar (listen to pathname changes)
- Sidebar open + back button → close sidebar rather than navigating back (optional, can skip for v1)

---

## File Changes Summary

| File | Change |
|------|--------|
| `apps/app/package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `apps/app/server/actions/email.ts` | Add `sendWeeklyDigest()` function + HTML template |
| `apps/app/app/api/cron/weekly-digest/route.ts` | New — cron endpoint, queries users + data, sends emails |
| `vercel.json` | New or update — add cron schedule |
| `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx` | Add month view grid, view switcher, drag-and-drop integration |
| `apps/app/app/(dashboard)/schedule/page.tsx` | Pass view param, expand data query for month range |
| `apps/app/components/sidebar-nav.tsx` | Add hamburger menu, mobile overlay, open/close state |
| `apps/app/app/(dashboard)/layout.tsx` | Add mobile top bar, responsive sidebar wrapper |

### New Files

| File | Purpose |
|------|---------|
| `apps/app/app/api/cron/weekly-digest/route.ts` | Cron handler for weekly digest |
| `vercel.json` | Vercel configuration with cron schedule |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@dnd-kit/core` | ^6.x | Core drag-and-drop engine |
| `@dnd-kit/sortable` | ^8.x | Sortable preset (may not be needed — evaluate during implementation) |
| `@dnd-kit/utilities` | ^3.x | CSS utilities for transforms |

---

## Out of Scope

- Auto-posting to social platforms (deferred — see social integration research notes)
- Full mobile redesign of complex pages (schedule grid, analytics)
- Email unsubscribe preferences (can use a simple unsubscribe link that sets a flag)
- Digest customization (frequency, content selection) — v1 is fixed weekly format
