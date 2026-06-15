# Dashboard Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium Aurora Dark dashboard with a Tinder-style swipe Review hub that triages fresh AI drafts and feeds the existing self-learning system.

**Architecture:** Promote the proven swipe mechanics from `apps/marketing` into a shared, themeable `@repo/ui` primitive consumed by both apps. Add a `/review` route in `apps/app` whose swipe decisions write `status`/`rating`/`reject_reason` onto `content_pieces` — the exact signals `loadLearningInsights()` already reads. Re-theme the dashboard to Aurora Dark by retuning the CSS-variable tokens, then polish the high-traffic pages.

**Tech Stack:** Next.js 15 (App Router, RSC + server actions), React 19, TypeScript, Tailwind (CSS-variable tokens, `darkMode: "class"`), Supabase (`@supabase/ssr`), vitest.

**Testing approach (read before starting):** `apps/marketing` has vitest; `@repo/ui` and `apps/app` do **not**. This plan adds vitest to both. We **TDD the pure logic** (swipe gestures, reason config, reject-reason aggregation, state-transition helpers) where tests are high-value and stable. For visual theming and React rendering we rely on `pnpm typecheck` + `pnpm build` + a manual visual check (use the `run` skill), because pixel/DOM tests for theming are brittle and low-value. Each task says explicitly which it uses.

**Conventions:**
- Run commands from the repo root unless stated. Per-package: `pnpm --filter @repo/ui test`, `pnpm --filter @repo/app typecheck`, `pnpm --filter @repo/marketing test`.
- `@repo/ui` components are dependency-free and style via template-string classNames (match existing `packages/ui/src/button.tsx`).
- Commit after each task with the message shown.

---

## Phase 1 — Shared swipe primitive (`@repo/ui`)

Foundation. Pure refactor verifiable against the existing onboarding flow.

### Task 1: Add vitest to `@repo/ui`

**Files:**
- Modify: `packages/ui/package.json`
- Create: `packages/ui/vitest.config.ts`

- [ ] **Step 1: Add the test script and dev dependency**

In `packages/ui/package.json`, add `"test": "vitest run"` and `"test:watch": "vitest"` to `scripts`, and add to `devDependencies`:

```json
"vitest": "^4.1.8"
```

- [ ] **Step 2: Create the vitest config**

`packages/ui/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Install**

Run: `pnpm install`
Expected: completes; `@repo/ui` now resolves `vitest`.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/package.json packages/ui/vitest.config.ts pnpm-lock.yaml
git commit -m "chore(ui): add vitest to @repo/ui"
```

---

### Task 2: Move swipe gesture logic into `@repo/ui` (TDD)

The pure logic and its tests already exist at `apps/marketing/lib/magic/swipe-gate.ts` (+ `.test.ts`). Move the reusable parts (`SwipeDirection`, `resolveDrag`, `glowFromDrag`, `DragGlow`) to `@repo/ui`. Leave the onboarding-gate-specific helpers (`isCorrectSwipe`, `nextGateIndex`, `isGateComplete`, `SwipeExpectation`) in marketing for now.

**Files:**
- Create: `packages/ui/src/swipe/swipe-gesture.ts`
- Create: `packages/ui/src/swipe/swipe-gesture.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/ui/src/swipe/swipe-gesture.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveDrag, glowFromDrag } from "./swipe-gesture";

describe("resolveDrag", () => {
  it("returns null below the threshold either way", () => {
    expect(resolveDrag(40, 100)).toBeNull();
    expect(resolveDrag(-40, 100)).toBeNull();
    expect(resolveDrag(0, 100)).toBeNull();
  });
  it("commits left past the negative threshold", () => {
    expect(resolveDrag(-100, 100)).toBe("left");
    expect(resolveDrag(-180, 100)).toBe("left");
  });
  it("commits right past the positive threshold", () => {
    expect(resolveDrag(100, 100)).toBe("right");
    expect(resolveDrag(180, 100)).toBe("right");
  });
});

describe("glowFromDrag", () => {
  it("has no glow at rest", () => {
    expect(glowFromDrag(0, 100)).toEqual({ side: null, opacity: 0 });
  });
  it("builds a left/right glow proportional to drag distance", () => {
    expect(glowFromDrag(-50, 100)).toEqual({ side: "left", opacity: 0.5 });
    expect(glowFromDrag(50, 100)).toEqual({ side: "right", opacity: 0.5 });
  });
  it("clamps opacity at 1 past the threshold", () => {
    expect(glowFromDrag(-200, 100)).toEqual({ side: "left", opacity: 1 });
    expect(glowFromDrag(200, 100)).toEqual({ side: "right", opacity: 1 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/ui test`
Expected: FAIL — cannot resolve `./swipe-gesture`.

- [ ] **Step 3: Write the implementation**

`packages/ui/src/swipe/swipe-gesture.ts`:

```ts
export type SwipeDirection = "left" | "right";

/**
 * Decide whether a horizontal drag offset `dx` (px) is a committed swipe.
 * Returns the direction once |dx| reaches `threshold`, else null (snap back).
 */
export function resolveDrag(dx: number, threshold: number): SwipeDirection | null {
  if (dx <= -threshold) return "left";
  if (dx >= threshold) return "right";
  return null;
}

export interface DragGlow {
  side: SwipeDirection | null;
  /** 0..1, scales with how far the card is dragged toward `threshold`. */
  opacity: number;
}

/** Tinder-style colour overlay strength from the current drag offset. */
export function glowFromDrag(dx: number, threshold: number): DragGlow {
  if (dx === 0 || threshold <= 0) return { side: null, opacity: 0 };
  const opacity = Math.min(Math.abs(dx) / threshold, 1);
  return { side: dx < 0 ? "left" : "right", opacity };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/ui test`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/swipe/swipe-gesture.ts packages/ui/src/swipe/swipe-gesture.test.ts
git commit -m "feat(ui): add shared swipe gesture logic"
```

---

### Task 3: Create the `<SwipeCard>` component

A headless, themeable pick-up-and-throw card. Renders caller-supplied `children`, handles pointer drag, tilt, glow ring, optional left/right overlay stamps, and fling-off. Exposes an imperative `flick(dir)` so buttons/keyboard can trigger an animated swipe.

**Files:**
- Create: `packages/ui/src/swipe/swipe-card.tsx`

- [ ] **Step 1: Write the component**

`packages/ui/src/swipe/swipe-card.tsx`:

```tsx
"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { resolveDrag, glowFromDrag, type SwipeDirection } from "./swipe-gesture";

const THRESHOLD = 100;
const FLING_DISTANCE = 600;
const FLING_MS = 220;

export interface SwipeCardHandle {
  /** Programmatically throw the card (used by buttons / keyboard). */
  flick: (direction: SwipeDirection) => void;
}

export interface SwipeCardProps {
  children: ReactNode;
  /** Fired once the card is thrown past the threshold or flicked. */
  onResolve: (direction: SwipeDirection) => void;
  /** Overlay stamps shown as the card is dragged each way (optional). */
  leftLabel?: ReactNode;
  rightLabel?: ReactNode;
  disabled?: boolean;
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  function SwipeCard({ children, onResolve, leftLabel, rightLabel, disabled }, ref) {
    const [dx, setDx] = useState(0);
    const [active, setActive] = useState(false);
    const [flung, setFlung] = useState<SwipeDirection | null>(null);
    const startX = useRef(0);

    function commit(direction: SwipeDirection) {
      setFlung(direction);
      setTimeout(() => onResolve(direction), FLING_MS);
    }

    useImperativeHandle(ref, () => ({
      flick: (direction) => {
        if (flung || disabled) return;
        commit(direction);
      },
    }));

    function onPointerDown(e: PointerEvent<HTMLDivElement>) {
      if (flung || disabled) return;
      setActive(true);
      startX.current = e.clientX;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent<HTMLDivElement>) {
      if (!active) return;
      setDx(e.clientX - startX.current);
    }
    function onPointerUp() {
      if (!active) return;
      setActive(false);
      const direction = resolveDrag(dx, THRESHOLD);
      if (!direction) {
        setDx(0);
        return;
      }
      commit(direction);
    }

    const translateX = flung ? (flung === "left" ? -FLING_DISTANCE : FLING_DISTANCE) : dx;
    const rotate = Math.max(-18, Math.min(18, translateX * 0.05));
    const glow = flung ? { side: flung, opacity: 1 } : glowFromDrag(dx, THRESHOLD);
    const ring =
      glow.side === "left"
        ? "0 0 40px rgba(239,68,68,0.55)"
        : glow.side === "right"
          ? "0 0 40px rgba(16,185,129,0.55)"
          : "0 10px 30px rgba(0,0,0,0.4)";

    return (
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative cursor-grab touch-none select-none active:cursor-grabbing"
        style={{
          transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
          boxShadow: ring,
          opacity: flung ? 0 : 1,
          transition: active
            ? "none"
            : "transform 0.3s ease-out, opacity 0.3s ease-out, box-shadow 0.15s",
        }}
      >
        {leftLabel && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-start pl-5"
            style={{ opacity: glow.side === "left" ? glow.opacity : 0, transition: active ? "none" : "opacity 0.15s" }}
            aria-hidden
          >
            {leftLabel}
          </div>
        )}
        {rightLabel && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-end pr-5"
            style={{ opacity: glow.side === "right" ? glow.opacity : 0, transition: active ? "none" : "opacity 0.15s" }}
            aria-hidden
          >
            {rightLabel}
          </div>
        )}
        {children}
      </div>
    );
  },
);
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm --filter @repo/ui typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/swipe/swipe-card.tsx
git commit -m "feat(ui): add themeable SwipeCard primitive"
```

---

### Task 4: Create the `<SwipeDeck>` component

Manages a stack of items: renders the top card via `<SwipeCard>`, a 2-card peek behind it, ✗/♥ buttons, `←`/`→` keyboard, an empty state, and single-step undo.

**Files:**
- Create: `packages/ui/src/swipe/swipe-deck.tsx`

- [ ] **Step 1: Write the component**

`packages/ui/src/swipe/swipe-deck.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SwipeCard, type SwipeCardHandle } from "./swipe-card";
import type { SwipeDirection } from "./swipe-gesture";

export interface SwipeDeckProps<T> {
  items: T[];
  keyFor: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  /** Called when the top card is decided. */
  onDecide: (item: T, direction: SwipeDirection) => void;
  /** Called when the user undoes the last decision (restore in your store). */
  onUndo?: (item: T, direction: SwipeDirection) => void;
  leftLabel?: ReactNode;
  rightLabel?: ReactNode;
  renderEmpty?: () => ReactNode;
}

export function SwipeDeck<T>({
  items,
  keyFor,
  renderCard,
  onDecide,
  onUndo,
  leftLabel,
  rightLabel,
  renderEmpty,
}: SwipeDeckProps<T>) {
  const [index, setIndex] = useState(0);
  const last = useRef<{ item: T; direction: SwipeDirection } | null>(null);
  const cardRef = useRef<SwipeCardHandle>(null);

  // Reset when a fresh batch arrives.
  useEffect(() => {
    setIndex(0);
    last.current = null;
  }, [items]);

  const current = items[index];

  function decide(direction: SwipeDirection) {
    if (!current) return;
    last.current = { item: current, direction };
    onDecide(current, direction);
    setIndex((i) => i + 1);
  }

  function undo() {
    if (!last.current) return;
    onUndo?.(last.current.item, last.current.direction);
    last.current = null;
    setIndex((i) => Math.max(0, i - 1));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") cardRef.current?.flick("left");
      else if (e.key === "ArrowRight") cardRef.current?.flick("right");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!current) {
    return <div>{renderEmpty?.() ?? null}</div>;
  }

  const peek = items.slice(index + 1, index + 3);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm">
        {peek.map((item, i) => (
          <div
            key={keyFor(item)}
            aria-hidden
            className="absolute inset-0 rounded-2xl border border-line bg-surface-card"
            style={{ transform: `translateY(${(i + 1) * 7}px) scale(${1 - (i + 1) * 0.025})`, zIndex: 0 }}
          />
        ))}
        <div className="relative" style={{ zIndex: 1 }}>
          <SwipeCard
            key={keyFor(current)}
            ref={cardRef}
            onResolve={decide}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          >
            {renderCard(current)}
          </SwipeCard>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => cardRef.current?.flick("left")}
          aria-label="Reject"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-2xl text-red-400 hover:bg-red-500/20"
        >
          ✗
        </button>
        <span className="text-[10px] text-content-muted">← / →<br />or drag</span>
        <button
          type="button"
          onClick={() => cardRef.current?.flick("right")}
          aria-label="Approve"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/45 bg-emerald-500/15 text-2xl text-emerald-400 hover:bg-emerald-500/25"
        >
          ♥
        </button>
      </div>

      {onUndo && last.current && (
        <button
          type="button"
          onClick={undo}
          className="mt-4 text-xs text-content-muted underline hover:text-content-primary"
        >
          Undo last swipe
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Export the primitives**

Replace `packages/ui/src/index.ts` with:

```ts
export { Button } from "./button";
export { SwipeCard } from "./swipe/swipe-card";
export type { SwipeCardHandle, SwipeCardProps } from "./swipe/swipe-card";
export { SwipeDeck } from "./swipe/swipe-deck";
export type { SwipeDeckProps } from "./swipe/swipe-deck";
export { resolveDrag, glowFromDrag } from "./swipe/swipe-gesture";
export type { SwipeDirection, DragGlow } from "./swipe/swipe-gesture";
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter @repo/ui typecheck && pnpm --filter @repo/ui test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/swipe/swipe-deck.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add SwipeDeck with keyboard, buttons and undo"
```

---

### Task 5: Migrate marketing onboarding to the shared primitive

Replace marketing's local drag math with the shared functions so there's one source of truth. The onboarding card keeps its own contents and the gate-specific helpers (`isCorrectSwipe`, `nextGateIndex`, `isGateComplete`) — only `resolveDrag`/`glowFromDrag`/`SwipeDirection` come from `@repo/ui`.

**Files:**
- Modify: `apps/marketing/lib/magic/swipe-gate.ts`
- Modify: `apps/marketing/lib/magic/swipe-gate.test.ts`
- Modify: `apps/marketing/components/magic/swipe-card.tsx`

- [ ] **Step 1: Re-export shared gesture fns from marketing's swipe-gate**

In `apps/marketing/lib/magic/swipe-gate.ts`, delete the local `SwipeDirection`, `resolveDrag`, `DragGlow`, `glowFromDrag` definitions and replace with a re-export at the top, keeping the gate helpers:

```ts
export {
  resolveDrag,
  glowFromDrag,
  type SwipeDirection,
  type DragGlow,
} from "@repo/ui";

export type SwipeExpectation = "reject" | "approve";

/** A swipe is correct when left==reject and right==approve. */
export function isCorrectSwipe(
  expected: SwipeExpectation,
  direction: import("@repo/ui").SwipeDirection,
): boolean {
  return (expected === "reject" && direction === "left") ||
    (expected === "approve" && direction === "right");
}

/** Advance only on a correct swipe; clamp at `count` (the complete sentinel). */
export function nextGateIndex(i: number, correct: boolean, count: number): number {
  if (!correct) return i;
  return Math.min(i + 1, count);
}

export function isGateComplete(i: number, count: number): boolean {
  return i >= count;
}
```

- [ ] **Step 2: Trim the marketing test to the helpers it still owns**

In `apps/marketing/lib/magic/swipe-gate.test.ts`, remove the `resolveDrag` and `glowFromDrag` describe blocks (now tested in `@repo/ui`) and their imports. Keep the `swipe gate` describe block (`isCorrectSwipe`, `nextGateIndex`, `isGateComplete`).

- [ ] **Step 3: Run marketing tests**

Run: `pnpm --filter @repo/marketing test`
Expected: PASS (the remaining swipe-gate tests + all others still green).

- [ ] **Step 4: Verify the onboarding card still typechecks against the re-exports**

`apps/marketing/components/magic/swipe-card.tsx` imports `resolveDrag`, `glowFromDrag`, `SwipeDirection`, `SwipeExpectation`, `isCorrectSwipe` from `@/lib/magic/swipe-gate` — all still exported. No code change needed.

Run: `pnpm --filter @repo/marketing typecheck`
Expected: PASS.

> Note: marketing's `swipe-card.tsx` keeps its own bespoke bin/save overlays for now (the onboarding gate's "correct direction" mechanic differs from the dashboard's free approve/reject). Fully collapsing it onto `<SwipeCard>` from `@repo/ui` is optional polish, out of scope here.

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/swipe-gate.ts apps/marketing/lib/magic/swipe-gate.test.ts
git commit -m "refactor(marketing): consume shared swipe gesture logic from @repo/ui"
```

---

## Phase 2 — Data layer + server actions (`apps/app`)

### Task 6: Add vitest to `apps/app`

**Files:**
- Modify: `apps/app/package.json`
- Create: `apps/app/vitest.config.ts`

- [ ] **Step 1: Add script + dep**

In `apps/app/package.json`: add `"test": "vitest run"` and `"test:watch": "vitest"` to `scripts`; add `"vitest": "^4.1.8"` to `devDependencies`.

- [ ] **Step 2: Create config**

`apps/app/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node" },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Install + sanity check**

Run: `pnpm install`
Expected: completes.

- [ ] **Step 4: Commit**

```bash
git add apps/app/package.json apps/app/vitest.config.ts pnpm-lock.yaml
git commit -m "chore(app): add vitest to apps/app"
```

---

### Task 7: Add the `reject_reason` column

**Files:**
- Create: `supabase/migrations/00029_reject_reason.sql`

- [ ] **Step 1: Write the migration**

`supabase/migrations/00029_reject_reason.sql`:

```sql
-- Optional reason captured when a draft is rejected in the swipe Review hub.
-- One of the chip slugs (see apps/app/lib/review/reject-reasons.ts) or null.
alter table content_pieces
  add column if not exists reject_reason text;
```

- [ ] **Step 2: Apply it** (via Supabase MCP `apply_migration`, or `supabase db push` if using the CLI)

Apply migration name `00029_reject_reason` with the SQL above to the live project.
Expected: column added; `list_tables` shows `reject_reason` on `content_pieces`.

- [ ] **Step 3: Regenerate types** (if a generated types file is used — check `@repo/types`)

Regenerate Supabase TypeScript types so `reject_reason` is known. If the project doesn't generate types from the DB (it currently uses hand-typed access), skip — the actions below cast as needed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00029_reject_reason.sql
git commit -m "feat(db): add reject_reason column to content_pieces"
```

---

### Task 8: Reject-reason config (TDD)

**Files:**
- Create: `apps/app/lib/review/reject-reasons.ts`
- Create: `apps/app/lib/review/reject-reasons.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/app/lib/review/reject-reasons.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { REJECT_REASONS, isRejectReason } from "./reject-reasons";

describe("reject reasons", () => {
  it("exposes a non-empty list with unique slugs", () => {
    const slugs = REJECT_REASONS.map((r) => r.slug);
    expect(slugs.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("validates known and unknown slugs", () => {
    expect(isRejectReason("too_salesy")).toBe(true);
    expect(isRejectReason("nonsense")).toBe(false);
    expect(isRejectReason(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @repo/app test`
Expected: FAIL — cannot resolve `./reject-reasons`.

- [ ] **Step 3: Implement**

`apps/app/lib/review/reject-reasons.ts`:

```ts
export const REJECT_REASONS = [
  { slug: "off_brand", label: "Off-brand" },
  { slug: "too_salesy", label: "Too salesy" },
  { slug: "boring", label: "Boring" },
  { slug: "wrong_offer", label: "Wrong offer" },
  { slug: "bad_image", label: "Bad image" },
] as const;

export type RejectReason = (typeof REJECT_REASONS)[number]["slug"];

const SLUGS = new Set(REJECT_REASONS.map((r) => r.slug));

export function isRejectReason(value: unknown): value is RejectReason {
  return typeof value === "string" && SLUGS.has(value as RejectReason);
}

export function rejectReasonLabel(slug: string): string {
  return REJECT_REASONS.find((r) => r.slug === slug)?.label ?? slug;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @repo/app test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/app/lib/review/reject-reasons.ts apps/app/lib/review/reject-reasons.test.ts
git commit -m "feat(app): reject-reason config"
```

---

### Task 9: Review server actions

Mirror the existing action conventions in `apps/app/server/actions/content.ts` (`"use server"`, `createClient()`, `getUser()` guard, `revalidatePath`). Ownership is enforced by RLS on `content_pieces` (same as `updateContentRating`, which updates by `id` only).

**Files:**
- Create: `apps/app/server/actions/review.ts`

- [ ] **Step 1: Write the actions**

`apps/app/server/actions/review.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isRejectReason, type RejectReason } from "@/lib/review/reject-reasons";

export interface ReviewCard {
  id: string;
  type: string;
  title: string | null;
  body: string;
  imageUrl: string | null;
  productId: string;
  productName: string;
  avatarName: string | null;
}

/** Drafts awaiting a yes/no, newest first, scoped by RLS to the user's products. */
export async function getReviewDeck(productId?: string): Promise<ReviewCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Mirrors the embed style proven in learning.ts: products + avatars resolve
  // directly off content_pieces.
  let query = supabase
    .from("content_pieces")
    .select(`
      id, type, title, body, image_url, product_id,
      products(name),
      avatars(name)
    `)
    .eq("status", "draft")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (productId) query = query.eq("product_id", productId);

  const { data } = await query;
  if (!data) return [];

  return (data as Record<string, unknown>[]).map((p) => {
    const product = p.products as { name: string } | null;
    const avatar = p.avatars as { name: string } | null;
    return {
      id: p.id as string,
      type: p.type as string,
      title: (p.title as string | null) ?? null,
      body: p.body as string,
      imageUrl: (p.image_url as string | null) ?? null,
      productId: p.product_id as string,
      productName: product?.name ?? "",
      avatarName: avatar?.name ?? null,
    };
  });
}

/** Right swipe: approve into the library + positive learning signal. */
export async function approveDraft(pieceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({ status: "approved", rating: 1 })
    .eq("id", pieceId);
  if (error) return { error: error.message };

  revalidatePath("/review");
  revalidatePath("/content");
  return { success: true };
}

/** Left swipe: archive + negative learning signal + optional reason. */
export async function rejectDraft(pieceId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const reject_reason: RejectReason | null = isRejectReason(reason) ? reason : null;

  const { error } = await supabase
    .from("content_pieces")
    .update({ archived: true, rating: -1, reject_reason })
    .eq("id", pieceId);
  if (error) return { error: error.message };

  revalidatePath("/review");
  revalidatePath("/content");
  return { success: true };
}

/** Single-step undo: restore a piece to its pre-swipe draft state. */
export async function undoLastDecision(pieceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({ status: "draft", archived: false, rating: null, reject_reason: null })
    .eq("id", pieceId);
  if (error) return { error: error.message };

  revalidatePath("/review");
  revalidatePath("/content");
  return { success: true };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @repo/app typecheck`
Expected: PASS. (If the generated DB types reject `reject_reason`, the column was added in Task 7; ensure types were regenerated or that access is untyped as in `learning.ts`.)

- [ ] **Step 3: Commit**

```bash
git add apps/app/server/actions/review.ts
git commit -m "feat(app): review server actions (approve/reject/undo/deck)"
```

> **Test note:** these actions are thin wrappers over Supabase calls behind the cookie-based `createClient()`, which is awkward to unit-test in isolation; their pure decision input (`isRejectReason`) is already covered in Task 8. They are exercised end-to-end via the manual verification in Task 12.

---

## Phase 3 — Review hub UI (`apps/app`)

### Task 10: `PostCard` card-content shell

The visual contents placed inside `<SwipeCard>`. Aurora-Dark styled via tokens.

**Files:**
- Create: `apps/app/components/review/post-card.tsx`

- [ ] **Step 1: Write the component**

`apps/app/components/review/post-card.tsx`:

```tsx
import type { ReviewCard } from "@/server/actions/review";

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#a855f7)",
  "linear-gradient(135deg,#0ea5e9,#6366f1)",
  "linear-gradient(135deg,#a855f7,#ec4899)",
];

function gradientFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h + ch.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[h];
}

export function PostCard({ card }: { card: ReviewCard }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-card p-4 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full border border-indigo-500/35 bg-indigo-500/15 px-2.5 py-1 text-[10px] text-indigo-200">
          {card.type}
        </span>
        <span className="text-[10px] text-content-muted">
          Draft{card.avatarName ? ` · ${card.avatarName}` : ""}
        </span>
      </div>
      <div
        className="h-40 overflow-hidden rounded-xl"
        style={{ background: gradientFor(card.id) }}
      >
        {card.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />
        )}
      </div>
      {card.title && <p className="mt-3 text-sm font-semibold text-content-primary">{card.title}</p>}
      <p className="mt-1 line-clamp-4 text-sm text-content-secondary">{card.body}</p>
      <p className="mt-2 text-[10px] text-content-muted">{card.productName}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @repo/app typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/app/components/review/post-card.tsx
git commit -m "feat(app): PostCard review card shell"
```

---

### Task 11: `ReviewDeck` client component

Wraps `<SwipeDeck>`, calls the server actions, shows the slide-up reason chips after a left-swipe, undo, empty state, and "Generate more".

**Files:**
- Create: `apps/app/components/review/review-deck.tsx`

- [ ] **Step 1: Write the component**

`apps/app/components/review/review-deck.tsx`:

```tsx
"use client";

import { useState } from "react";
import { SwipeDeck, type SwipeDirection } from "@repo/ui";
import { PostCard } from "./post-card";
import { REJECT_REASONS } from "@/lib/review/reject-reasons";
import { approveDraft, rejectDraft, undoLastDecision, type ReviewCard } from "@/server/actions/review";

const REJECT_STAMP = (
  <span className="-rotate-12 rounded-lg border-2 border-red-400 px-3 py-1 text-lg font-extrabold tracking-wider text-red-300">
    REJECT ✗
  </span>
);
const APPROVE_STAMP = (
  <span className="rotate-12 rounded-lg border-2 border-emerald-400 px-3 py-1 text-lg font-extrabold tracking-wider text-emerald-300">
    APPROVE ♥
  </span>
);

export function ReviewDeck({ initialCards }: { initialCards: ReviewCard[] }) {
  const [cards] = useState(initialCards);
  const [approved, setApproved] = useState(0);
  // pieceId of the just-rejected card whose reason panel is open.
  const [reasonFor, setReasonFor] = useState<string | null>(null);

  function onDecide(card: ReviewCard, direction: SwipeDirection) {
    if (direction === "right") {
      setApproved((n) => n + 1);
      void approveDraft(card.id);
      setReasonFor(null);
    } else {
      void rejectDraft(card.id); // fire immediately; reason is optional
      setReasonFor(card.id);
    }
  }

  function onUndo(card: ReviewCard) {
    void undoLastDecision(card.id);
    setReasonFor(null);
  }

  function pickReason(pieceId: string, slug: string) {
    void rejectDraft(pieceId, slug);
    setReasonFor(null);
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <SwipeDeck<ReviewCard>
        items={cards}
        keyFor={(c) => c.id}
        renderCard={(c) => <PostCard card={c} />}
        onDecide={onDecide}
        onUndo={onUndo}
        leftLabel={REJECT_STAMP}
        rightLabel={APPROVE_STAMP}
        renderEmpty={() => (
          <div className="rounded-2xl border border-line bg-surface-card p-8 text-center">
            <div className="text-3xl">🎉</div>
            <h3 className="mt-2 font-heading text-lg font-semibold text-content-primary">All caught up</h3>
            <p className="mt-1 text-sm text-content-muted">{approved} approved this session.</p>
          </div>
        )}
      />

      {reasonFor && (
        <div className="mt-4 animate-fade-in rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4">
          <p className="mb-2 text-xs text-red-300">Binned. Why? <span className="text-content-muted">(optional)</span></p>
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r.slug}
                type="button"
                onClick={() => pickReason(reasonFor, r.slug)}
                className="rounded-full border border-line px-2.5 py-1 text-[11px] text-content-secondary hover:border-indigo-400 hover:text-content-primary"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @repo/app typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/app/components/review/review-deck.tsx
git commit -m "feat(app): ReviewDeck client with reason chips and undo"
```

---

### Task 12: `/review` route + verify the loop

**Files:**
- Create: `apps/app/app/(dashboard)/review/page.tsx`

- [ ] **Step 1: Write the page**

`apps/app/app/(dashboard)/review/page.tsx`:

```tsx
import { getReviewDeck } from "@/server/actions/review";
import { ReviewDeck } from "@/components/review/review-deck";

export default async function ReviewPage() {
  const cards = await getReviewDeck();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-content-primary">Review</h1>
      </div>
      <p className="mb-8 text-sm text-content-muted">
        {cards.length} draft{cards.length === 1 ? "" : "s"} to review · swipe right to approve, left to bin.
      </p>
      <ReviewDeck initialCards={cards} />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm --filter @repo/app typecheck && pnpm --filter @repo/app build`
Expected: PASS; `/review` appears in the route list.

- [ ] **Step 3: Manual verification (use the `run` skill)**

Run the app (`pnpm --filter @repo/app dev`, port 3001), log in, generate some content so drafts exist, open `/review`. Confirm: cards stack and drag; right-swipe removes a card and (check DB / Content page) sets `status='approved'`; left-swipe archives, sets `rating=-1`, and shows reason chips; tapping a chip sets `reject_reason`; Undo restores the card; empty state shows when the deck is exhausted; `←`/`→` keys and ✗/♥ buttons work.

- [ ] **Step 4: Commit**

```bash
git add "apps/app/app/(dashboard)/review/page.tsx"
git commit -m "feat(app): /review hub route"
```

---

### Task 13: Add "Review" to the sidebar with a pending-count badge

**Files:**
- Modify: `apps/app/components/sidebar-nav.tsx`

- [ ] **Step 1: Add the nav item**

In `apps/app/components/sidebar-nav.tsx`, add a new entry to `navItems` immediately after the `Dashboard` entry (so Review sits near the top):

```tsx
  {
    label: "Review",
    href: "/review",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="13" height="17" rx="2" />
        <path d="M8 20l3 1 3-1" />
      </svg>
    ),
  },
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @repo/app typecheck`
Expected: PASS. Visually, "Review" appears in the sidebar and highlights when active (existing `isActive` uses `startsWith`, so `/review` works).

> The live pending-count badge is deferred to Task 16 (Home launchpad), which already fetches deck counts — we surface the number there to avoid an extra query in the always-rendered sidebar. (Logged here so the badge isn't silently dropped.)

- [ ] **Step 3: Commit**

```bash
git add apps/app/components/sidebar-nav.tsx
git commit -m "feat(app): add Review to sidebar nav"
```

---

## Phase 4 — Aurora Dark theme

The dashboard already has dark tokens (`.dark` block in `globals.css`); Aurora Dark = retune those values toward the near-black + indigo/violet palette, add an accent + glow token, and default the dashboard to dark.

### Task 14: Retune tokens to Aurora Dark + default to dark

**Files:**
- Modify: `apps/app/app/globals.css`
- Modify: `apps/app/tailwind.config.ts`
- Modify: `apps/app/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Retune the `.dark` palette + add accent variables**

In `apps/app/app/globals.css`, replace the `.dark { … }` block with:

```css
  .dark {
    --color-bg-primary: #0a0a0f;
    --color-bg-secondary: #101018;
    --color-bg-tertiary: #18181f;
    --color-bg-card: rgba(255, 255, 255, 0.04);
    --color-bg-card-hover: rgba(255, 255, 255, 0.06);
    --color-text-primary: #f4f4f5;
    --color-text-secondary: #a1a1aa;
    --color-text-muted: #71717a;
    --color-border: rgba(255, 255, 255, 0.08);
    --color-border-subtle: rgba(255, 255, 255, 0.04);
    --color-shadow: rgba(0, 0, 0, 0.4);
    --color-accent: #6366f1;
    --color-accent-2: #a855f7;
  }
```

- [ ] **Step 2: Expose accent + a glow shadow as Tailwind tokens**

In `apps/app/tailwind.config.ts`, inside `theme.extend.colors` add an `accent` entry, and inside `theme.extend.boxShadow` add a `glow`:

```ts
        accent: {
          DEFAULT: "var(--color-accent)",
          2: "var(--color-accent-2)",
        },
```

```ts
      boxShadow: {
        card: "0 1px 3px var(--color-shadow)",
        glow: "0 0 50px rgba(99,102,241,0.18)",
      },
```

- [ ] **Step 3: Default the dashboard to dark**

In `apps/app/app/(dashboard)/layout.tsx`, ensure the dashboard renders in dark mode. Add the `dark` class to the shell's root wrapper element (the outermost element this layout renders). If the layout returns `<DashboardShell …>`, wrap it:

```tsx
return (
  <div className="dark">
    {/* existing DashboardShell / children */}
  </div>
);
```

(Keep the existing `ThemeToggle`; defaulting to dark is the premium default, the toggle still flips the `.dark` class on the document per its current implementation.)

- [ ] **Step 4: Verify build + visual**

Run: `pnpm --filter @repo/app typecheck && pnpm --filter @repo/app build`
Expected: PASS.
Then visually (run skill): the dashboard reads as near-black Aurora Dark with indigo accents; text contrast is comfortable on Home, Review, Content, Campaigns, Brain, Schedule.

- [ ] **Step 5: Commit**

```bash
git add apps/app/app/globals.css apps/app/tailwind.config.ts "apps/app/app/(dashboard)/layout.tsx"
git commit -m "feat(app): Aurora Dark theme tokens + dark dashboard default"
```

---

## Phase 5 — Page polish

### Task 15: Home as launchpad

**Files:**
- Modify: `apps/app/app/(dashboard)/page.tsx`

- [ ] **Step 1: Add the hero "Daily review" card**

At the top of the dashboard home's main content (in `apps/app/app/(dashboard)/page.tsx`), fetch the pending count and render a hero linking to `/review`. Add the import and the count near the existing data loads:

```tsx
import Link from "next/link";
import { getReviewDeck } from "@/server/actions/review";
// …
const deck = await getReviewDeck();
const pending = deck.length;
```

Then render, above the existing stats grid:

```tsx
<Link
  href="/review"
  className="mb-6 flex items-center justify-between rounded-2xl border border-indigo-400/35 bg-gradient-to-br from-indigo-500/[0.22] to-fuchsia-500/[0.18] p-6 shadow-glow transition-transform hover:scale-[1.01]"
>
  <div>
    <p className="text-[11px] uppercase tracking-wider text-indigo-200">Daily review</p>
    <p className="mt-1 text-xl font-bold text-content-primary">
      {pending > 0 ? `${pending} fresh draft${pending === 1 ? "" : "s"} are waiting` : "You're all caught up"}
    </p>
    <p className="mt-1 text-sm text-content-secondary">Swipe through them in ~2 minutes. Your AI learns from every call.</p>
  </div>
  <span className="whitespace-nowrap rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950">Start reviewing 🃏</span>
</Link>
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @repo/app typecheck && pnpm --filter @repo/app build`
Expected: PASS. Visually: hero appears, links to `/review`, glows.

- [ ] **Step 3: Commit**

```bash
git add "apps/app/app/(dashboard)/page.tsx"
git commit -m "feat(app): home launchpad with daily review hero"
```

---

### Task 16: Polish pass on Content, Campaigns, Brain, Schedule

These pages already use the semantic tokens, so the retheme carries most of the look. This task is a deliberate consistency sweep, not a rewrite.

**Files (modify as needed):**
- `apps/app/app/(dashboard)/content/content-list.tsx`
- `apps/app/app/(dashboard)/campaigns/campaign-panel.tsx`
- `apps/app/app/(dashboard)/campaigns/campaign-list.tsx`
- `apps/app/app/(dashboard)/products/[id]/brain/page.tsx`
- `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx`

- [ ] **Step 1: Standardise card styling**

For each file, ensure post/section cards use the shared idiom: `rounded-2xl border border-line bg-surface-card` (bump any `rounded-xl` cards to `rounded-2xl` for the premium feel) and that primary action buttons use the accent. Do **not** change logic or data flow — class names only.

- [ ] **Step 2: Verify after each file**

Run: `pnpm --filter @repo/app typecheck`
Expected: PASS. Visually confirm each page reads consistently in Aurora Dark.

- [ ] **Step 3: Commit**

```bash
git add "apps/app/app/(dashboard)"
git commit -m "polish(app): consistent Aurora Dark cards across dashboard pages"
```

---

## Phase 6 — Learning enrichment (teach the AI *why*)

`loadLearningInsights()` filters `archived=false`, so rejected drafts (archived) are invisible to it. Add a separate, focused query that aggregates recent reject reasons and inject a short line into the generation prompts.

### Task 17: Reject-reason aggregation (TDD)

**Files:**
- Create: `apps/app/lib/review/summarize-reject-reasons.ts`
- Create: `apps/app/lib/review/summarize-reject-reasons.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/app/lib/review/summarize-reject-reasons.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { summarizeRejectReasons } from "./summarize-reject-reasons";

describe("summarizeRejectReasons", () => {
  it("counts and orders reasons by frequency, labelled", () => {
    const rows = [
      { reject_reason: "too_salesy" },
      { reject_reason: "too_salesy" },
      { reject_reason: "boring" },
      { reject_reason: null },
      { reject_reason: "unknown_slug" },
    ];
    expect(summarizeRejectReasons(rows)).toEqual([
      { label: "Too salesy", count: 2 },
      { label: "Boring", count: 1 },
    ]);
  });
  it("returns an empty array when there are no valid reasons", () => {
    expect(summarizeRejectReasons([{ reject_reason: null }])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @repo/app test`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement**

`apps/app/lib/review/summarize-reject-reasons.ts`:

```ts
import { isRejectReason, rejectReasonLabel } from "./reject-reasons";

export interface RejectReasonRow {
  reject_reason: string | null;
}

export interface RejectReasonSummary {
  label: string;
  count: number;
}

/** Count valid reject reasons, most frequent first, mapped to display labels. */
export function summarizeRejectReasons(rows: RejectReasonRow[]): RejectReasonSummary[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!isRejectReason(row.reject_reason)) continue;
    counts.set(row.reject_reason, (counts.get(row.reject_reason) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => ({ label: rejectReasonLabel(slug), count }));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @repo/app test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/app/lib/review/summarize-reject-reasons.ts apps/app/lib/review/summarize-reject-reasons.test.ts
git commit -m "feat(app): summarize reject reasons for learning"
```

---

### Task 18: Inject reject reasons into content generation

**Files:**
- Modify: `apps/app/server/actions/content.ts`

- [ ] **Step 1: Add a loader for recent reject reasons**

In `apps/app/server/actions/content.ts`, add this helper (top-level, near `buildContentPerformanceContext`). It runs its own query because the learning loader excludes archived pieces:

```ts
import { summarizeRejectReasons } from "@/lib/review/summarize-reject-reasons";

async function loadRejectReasonLine(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
): Promise<string> {
  const { data } = await supabase
    .from("content_pieces")
    .select("reject_reason")
    .eq("product_id", productId)
    .eq("archived", true)
    .not("reject_reason", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const summary = summarizeRejectReasons((data as { reject_reason: string | null }[]) ?? []);
  if (summary.length === 0) return "";
  const top = summary.slice(0, 3).map((s) => s.label.toLowerCase()).join(", ");
  return `\n\nRecent drafts were rejected mostly for being: ${top}. Avoid these.`;
}
```

- [ ] **Step 2: Append the line where the performance context is built**

In `generateContentForCampaign()` (and `generateContentBulk()` if it builds its own prompt), where `buildContentPerformanceContext(insights)` is appended to the prompt, also append the reject-reason line. Example at the existing call site:

```ts
const perfContext = insights ? buildContentPerformanceContext(insights) : "";
const rejectLine = await loadRejectReasonLine(supabase, productId);
// …include `${perfContext}${rejectLine}` in the prompt string sent to Claude.
```

(`productId` and `supabase` are already in scope in these functions — reuse them; do not open a second client.)

- [ ] **Step 3: Verify**

Run: `pnpm --filter @repo/app typecheck && pnpm --filter @repo/app build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/app/server/actions/content.ts
git commit -m "feat(app): teach content generation from reject reasons"
```

---

### Task 19: Inject reject reasons into brain generation

**Files:**
- Modify: `apps/app/server/actions/brain.ts`

- [ ] **Step 1: Reuse the same pattern**

In `apps/app/server/actions/brain.ts`, where `buildPerformanceContext()` output is appended to the brain prompt, also append a reject-reason line built the same way. Add the import and an inline query (the brain action already has `supabase` and the product id in scope):

```ts
import { summarizeRejectReasons } from "@/lib/review/summarize-reject-reasons";
// …
const { data: rejRows } = await supabase
  .from("content_pieces")
  .select("reject_reason")
  .eq("product_id", productId)
  .eq("archived", true)
  .not("reject_reason", "is", null)
  .order("created_at", { ascending: false })
  .limit(50);
const rejSummary = summarizeRejectReasons((rejRows as { reject_reason: string | null }[]) ?? []);
const rejectLine =
  rejSummary.length > 0
    ? `\n\nRecent rejections were mostly: ${rejSummary.slice(0, 3).map((s) => s.label.toLowerCase()).join(", ")}. Steer away from these.`
    : "";
// append `${rejectLine}` alongside the existing performance context in the prompt.
```

> If you'd rather not duplicate the query, extract `loadRejectReasonLine` from Task 18 into `apps/app/lib/review/reject-reason-context.ts` and import it in both `content.ts` and `brain.ts`. Recommended if both call sites land cleanly.

- [ ] **Step 2: Verify**

Run: `pnpm --filter @repo/app typecheck && pnpm --filter @repo/app build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/app/server/actions/brain.ts
git commit -m "feat(app): teach brain generation from reject reasons"
```

---

## Final verification

- [ ] Run all test suites:
  `pnpm --filter @repo/ui test && pnpm --filter @repo/app test && pnpm --filter @repo/marketing test`
  Expected: all green.
- [ ] Typecheck + build both apps:
  `pnpm --filter @repo/app typecheck && pnpm --filter @repo/app build && pnpm --filter @repo/marketing build`
  Expected: PASS.
- [ ] Manual end-to-end (run skill): onboarding swipe still works (marketing); `/review` swipe loop works with reasons + undo; dashboard is Aurora Dark; home hero links to review.

---

## Spec coverage check

| Spec section | Task(s) |
|---|---|
| §4.1 Shared `@repo/ui` primitive | 1–4 |
| §4.1 Migrate marketing | 5 |
| §4.2 Review hub route + nav | 12, 13 |
| §4.3 Data flow | 9, 11 |
| §5 `reject_reason` migration + signals | 7, 9 |
| §6 Server actions | 9 |
| §7 Review UX (deck, approve, reject chips, undo, empty, responsive) | 10, 11, 12 |
| §7.3 Tunable reason config | 8 |
| §8 Aurora Dark theming | 14 |
| §8.1 Home launchpad | 15 |
| §8 Page polish | 16 |
| §9 Learning enrichment (reasons) | 17, 18, 19 |
| §10 Testing | 1, 2, 6, 8, 17 (+ manual verifications) |
| §11 Phasing | Phases 1–6 map 1:1 |
```
