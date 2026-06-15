# Dashboard Revamp — Premium Aurora Dark + Swipe Review Hub

**Date:** 2026-06-16
**Status:** Design — awaiting approval
**Author:** James + Claude

---

## 1. Summary

Revamp the post-login dashboard (`apps/app`) to feel premium and modern, and introduce a **Tinder-style swipe Review hub** where the user triages freshly generated post drafts. Approve/reject decisions feed the **existing self-learning system** so generation improves over time.

Two halves, one spec:

1. **Swipe Review hub** — a new daily-ritual surface for reviewing AI drafts by swiping.
2. **Aurora Dark visual revamp** — a dark, glassy, indigo→violet theme rolled across the dashboard via shared design tokens, with deep polish on the high-traffic pages.

This is intentionally a single, well-sectioned spec with a **phased build** (see §11) so it stays executable.

---

## 2. Background — what already exists

A surprising amount of the "AI learns from saved/rejected posts" backend is already built:

- **`content_pieces`** table has `status` (`draft` | `approved` | `scheduled` | `posted`), `rating` (`-1` | `0` | `1`), `archived` (bool), and `engagement_*` columns. (`supabase/migrations/00016_self_learning_columns.sql`)
- **`loadLearningInsights()`** (`apps/app/server/actions/learning.ts`) scores every piece (40% clicks / 40% engagement / 20% rating), and extracts `topPerformers`, `underperformers`, and explicit `thumbsDownPieces`.
- That context is injected into generation prompts via `buildPerformanceContext()` (`apps/app/server/actions/brain.ts`) and `buildContentPerformanceContext()` (`apps/app/server/actions/content.ts`).
- Feedback is collected today through small thumbs up/down buttons (`apps/app/components/rating-buttons.tsx`) scattered across Content, Campaigns, and Schedule pages. **There is no swipe UI.**

A working, tested swipe interaction also already exists in the marketing app's onboarding gate:

- `apps/marketing/components/magic/swipe-card.tsx` — pick-up-and-throw card with tilt + red/green glow + fling-off.
- `apps/marketing/lib/magic/swipe-gate.ts` (+ `swipe-gate.test.ts`) — pure gesture logic (`resolveDrag`, `glowFromDrag`, `isCorrectSwipe`, thresholds).

**Implication:** this project is mostly UX + wiring + theming. We are *not* building a new learning engine, and we are *not* writing swipe mechanics from scratch — we promote the proven ones to a shared package.

---

## 3. Decisions locked (from brainstorming)

| Decision | Choice |
|---|---|
| Spec scope | One full spec: swipe hub **and** visual revamp |
| Swipe gestures | **2-way** — left = reject, right = approve |
| Deck contents | **Fresh AI drafts** (`status = 'draft'`) awaiting a yes/no |
| After approve | `status = 'approved'` → lands in library/schedule as ready-to-go |
| After reject | `archived = true`, `rating = -1`, optional `reject_reason` |
| Reject reason | **Optional** one-tap chips after a left-swipe |
| Placement | New top-level **Review** nav item (a dedicated hub) |
| Reasons UI | **Slide-up panel over the card** (one impl for mobile + desktop) |
| Undo | **Yes** — single-step "undo last swipe" |
| Visual direction | **Aurora Dark** — dark base, glassy cards, indigo→violet glow |
| Swipe component | **Shared `@repo/ui` primitive**, consumed by both apps |
| Reject-reason store | **Single `reject_reason` column** (not a decisions table) — YAGNI |
| Restyle scope | Token retheme (all pages) + deep polish on Home, Review, Content, Campaigns, Brain, Schedule |

---

## 4. Architecture

### 4.1 Shared swipe primitive — `@repo/ui`

Promote the gesture logic and card shell into the shared package (`packages/ui`, exported from `src/index.ts`):

- **`swipe-gesture.ts`** — move the pure logic from `apps/marketing/lib/magic/swipe-gate.ts` (`resolveDrag`, `glowFromDrag`, `isCorrectSwipe`, `SwipeDirection`, thresholds) plus its test file. This is the single source of truth for "how a swipe resolves."
- **`<SwipeCard>`** — headless, themeable pick-up-and-throw card. Renders `children` (the caller supplies card contents), handles pointer drag, tilt, glow, and fling-off. Props: `onResolve(direction)`, optional `disabled`. No knowledge of posts or Supabase.
- **`<SwipeDeck>`** — manages a stack of items, the keyboard bindings (`←`/`→`), the ✗/♥ buttons, the back-card peek, and exposes `onDecide(item, direction)` plus an imperative `undo()`.

**Migration:** `apps/marketing`'s onboarding gate (`story-carousel.tsx` / `swipe-card.tsx`) is refactored to consume the shared primitive. Net behaviour identical; one codebase to maintain. Marketing keeps its own card *contents* (platform/caption/gradient), only the mechanics are shared.

> Note: the shared primitive is theme-agnostic — it inherits whatever Tailwind tokens the host app provides, so the same component looks Aurora-Dark in the dashboard and matches the magic flow in marketing.

### 4.2 Review hub — `apps/app`

- **Route:** `apps/app/app/(dashboard)/review/page.tsx` — server component. Loads the current user, the pending draft deck (optionally filtered by product), and renders the client `ReviewDeck`.
- **`ReviewDeck` (client):** wraps `<SwipeDeck>` from `@repo/ui`, supplies card contents (the `PostCard` shell — platform pill, image/gradient, headline, caption, hashtags, avatar/campaign label), and calls server actions on each decision. Owns the slide-up reason panel, the undo affordance, the empty state, and the "✨ Generate more" action.
- **Nav:** add a **Review** item to `apps/app/components/sidebar-nav.tsx` (the existing `w-60` labelled sidebar — the brainstorm mockup's icon-rail was illustrative; we keep the current sidebar pattern and just add the entry, with a pending-count badge).

### 4.3 Data flow per swipe

```
draft post → <SwipeCard>
   ├─ swipe right → approveDraft(postId)          → status:'approved', rating:+1
   └─ swipe left  → rejectDraft(postId, reason?)  → archived:true, rating:-1, reject_reason
                         ↓
        existing loadLearningInsights() reads rating + reject_reason
                         ↓
        buildPerformanceContext() / buildContentPerformanceContext()
                         ↓
        injected into next brain/content generation → better drafts
```

---

## 5. Data model change

One migration: **`supabase/migrations/00029_reject_reason.sql`**

```sql
alter table content_pieces
  add column reject_reason text;
-- nullable; one of the chip slugs (see §7.3) or null when skipped.
```

No other schema changes. Approve reuses `status`; reject reuses `archived` + `rating`. Regenerate the Supabase TypeScript types after applying.

**Signal semantics:**
- **Approve** → `status:'approved'`, `rating:+1`. A right-swipe is an explicit positive signal, so it nudges learning "more like this" while also moving the piece into the approved pile.
- **Reject** → `archived:true`, `rating:-1`, `reject_reason:<slug|null>`. Matches today's thumbs-down behaviour (already excluded/penalised by the learning engine) plus the optional reason.

> A future richer audit (append-only `content_decisions` table) is explicitly **out of scope** (§12).

---

## 6. Server actions (`apps/app/server/actions/review.ts`)

New file, all `"use server"`, all auth-guarded via `createClient()` + `supabase.auth.getUser()` (existing pattern), all `revalidatePath()` the affected routes.

- **`getReviewDeck({ productId? }): ReviewCard[]`** — fetch `content_pieces` where `status='draft'` and `archived=false`, scoped to the user's products, newest first, optionally filtered by product. Returns the fields the card needs (id, type/platform, title/headline, body, metadata, image_url, campaign/avatar label).
- **`approveDraft(pieceId)`** — set `status='approved'`, `rating:1`. Reuses the same ownership checks as existing content actions.
- **`rejectDraft(pieceId, reason?: RejectReason)`** — set `archived=true`, `rating:-1`, `reject_reason=reason ?? null`.
- **`undoLastDecision(pieceId, previous)`** — restore the piece's prior state (status/archived/rating/reject_reason) captured client-side before the swipe. Single-step.
- **Generate more** — reuse existing `generateContentBulk()` / `generateContentForCampaign()` (`apps/app/server/actions/content.ts`); the Review hub just calls them and refreshes the deck. No new generation logic.

---

## 7. Review hub UX

### 7.1 The deck
- Centered card stack with a subtle 2-card peek behind the top card (per mockup).
- **Top card (`PostCard` shell):** platform pill, image (generated `image_url` or gradient fallback), **headline**, caption preview, hashtags, and a muted "Draft · Avatar: <name>" label.
- **Gestures:** drag to throw (tilt + glow), or ✗/♥ buttons, or `←`/`→` keys. Right glow = green/approve, left glow = red/reject (reusing `glowFromDrag`).
- **Header:** product filter dropdown ("All products ▾"), "✨ Generate more", and a counter ("N drafts left · M approved this week").

### 7.2 Approve
Card flings right, `approveDraft()` fires, next card animates up. No interstitial — fast pass.

### 7.3 Reject + optional reason chips
Card flings left, `rejectDraft()` fires immediately with no reason (so a fast swipe is never blocked). A **slide-up panel** over the just-cleared area then offers one-tap chips; tapping one calls `rejectDraft` again / patches the reason. Swiping the next card dismisses it.

Reason chips live in **one tunable config constant** (e.g. `apps/app/lib/review/reject-reasons.ts`):

```ts
export const REJECT_REASONS = [
  { slug: "off_brand",   label: "Off-brand" },
  { slug: "too_salesy",  label: "Too salesy" },
  { slug: "boring",      label: "Boring" },
  { slug: "wrong_offer", label: "Wrong offer" },
  { slug: "bad_image",   label: "Bad image" },
] as const;
```

### 7.4 Undo
A small "Undo" affordance (toast or header button) reverses the **last** decision via `undoLastDecision()`, restoring the card to the top of the deck. Single-step only.

### 7.5 Empty / all-caught-up state
When the deck empties: a celebratory panel ("All caught up — N approved today") with "✨ Generate a fresh batch" and "Review another product".

### 7.6 Responsive
- **Mobile:** drag + slide-up reason panel + ✗/♥ buttons.
- **Desktop:** same, plus `←`/`→` keyboard and hover states. Buttons always present for accessibility (a keyboard/non-pointer path always exists).

---

## 8. Aurora Dark theming

- **Token-level retheme** in `@repo/ui` (`packages/ui/tailwind.config.ts` + the CSS custom properties behind `surface-*`, `content-*`, `line`, accent). Set the dark Aurora palette as the dashboard's theme so **every page inherits it** without per-page rewrites. (`tailwind.config.ts` already uses `darkMode: "class"`.)
- **Palette:** near-black base (`~#0a0a0f`), glassy cards (`rgba(255,255,255,0.04)` on `rgba(255,255,255,0.08)` borders), indigo→violet accent (`#6366f1 → #a855f7`), soft glow on primary surfaces, emerald/red for approve/reject.
- **Card aesthetic:** `rounded-2xl`, subtle translucent fill, hairline border, generous padding, occasional gradient glow on hero/active elements — matching the onboarding flow.
- **Deep-polish pages:** Home (launchpad), Review, Content, Campaigns, Brain, Schedule. Other pages inherit the tokens and get light touch-ups only.

### 8.1 Home as launchpad
Restyle `apps/app/app/(dashboard)/page.tsx`:
- **Hero "Daily review" card** (gradient glow) → "N fresh drafts are waiting · Start reviewing 🃏" linking to `/review`.
- **Stat row:** Approved (wk), Scheduled, Clicks (30d), Products.
- **Product cards** with gradient marks + draft/scheduled counts + "New product" tile.

---

## 9. Learning integration

The decisions write the exact signals the existing engine already consumes — minimal new code:

- `rating` (+1 approve / -1 reject) already flows through `computeCompositeScore()` and `loadLearningInsights()` (top/under/thumbs-down). No change needed for the basic loop.
- **`reject_reason` enrichment:** extend `buildContentPerformanceContext()` / `buildPerformanceContext()` to aggregate recent reject reasons into the "what to avoid" section of the prompt (e.g. "Recent rejections were mostly: too salesy, off-brand — avoid these"). This is the one place we teach the model *why*, not just *what*.

---

## 10. Testing strategy

- **Pure logic (unit):** the migrated `swipe-gesture.ts` keeps and extends its existing vitest tests (`resolveDrag`, `glowFromDrag`, direction resolution, thresholds). This is the highest-value coverage and already exists.
- **Reason config:** trivial test that slugs are unique/stable.
- **Server actions:** unit-test `approveDraft` / `rejectDraft` / `undoLastDecision` state transitions against a mocked Supabase client (existing action-test pattern), including ownership guard and the reject-with/without-reason paths.
- **Learning enrichment:** test that `buildContentPerformanceContext()` includes aggregated reject reasons when present and omits the section when absent.
- **Component:** light interaction test of `ReviewDeck` (approve advances; reject opens reason panel; undo restores). Keep DOM tests minimal; lean on the pure-logic tests.

---

## 11. Phased build

Each phase is independently shippable and reviewable.

1. **Phase 1 — Shared swipe primitive.** Extract `swipe-gesture.ts` + `<SwipeCard>`/`<SwipeDeck>` into `@repo/ui` with tests; migrate marketing onboarding to consume it. No dashboard changes yet. *(Pure refactor — safe, verifiable against existing onboarding.)*
2. **Phase 2 — Data + actions.** Migration `00029_reject_reason.sql`; `review.ts` server actions; reject-reasons config; regenerate types. Unit-tested, no UI.
3. **Phase 3 — Review hub.** `/review` route, `ReviewDeck`, `PostCard`, slide-up reasons, undo, empty state, "Generate more", sidebar nav item + badge.
4. **Phase 4 — Aurora Dark theme.** Retheme `@repo/ui` tokens; verify all dashboard pages still read well; fix contrast/regressions.
5. **Phase 5 — Page polish.** Home launchpad, then Content / Campaigns / Brain / Schedule polish passes.
6. **Phase 6 — Learning enrichment.** Aggregate `reject_reason` into generation prompts.

---

## 12. Out of scope / future

- Append-only `content_decisions` audit table (richer history).
- 3-/4-way swipes (edit-regenerate, save-for-later).
- Approve → auto-schedule to open slots.
- Image-regeneration rate limits by tier (tracked separately).
- Multi-step undo / full decision history view.

---

## 13. Open questions

None blocking. Defaults chosen for everything above; the reject-reason chip set and the theme palette values are explicitly tunable after first sight of real output.
