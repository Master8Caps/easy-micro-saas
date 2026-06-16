# Review Card Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the swipe Review hub card — pretty type label, a platform pill with icon, clear product/avatar context (Layout A), and a clean "recessed dim deck" stack.

**Architecture:** A new pure `resolveChannel` helper derives a content piece's platform; `getReviewDeck` carries it on `ReviewCard`. The shared `ChannelPill` gains platform icons (app-wide). `PostCard` is rebuilt to the product-led header layout. The shared `SwipeDeck` peek cards recede via larger offset/scale + opacity.

**Tech Stack:** Next.js 15 (App Router, server actions), React, TypeScript, Tailwind, Supabase, Vitest.

Spec: `docs/superpowers/specs/2026-06-16-review-card-polish-design.md`

---

### Task 1: `resolveChannel` pure helper

Derives a platform string for a content piece from (in precedence order) its campaign channel, its metadata channel, or its `type` prefix.

**Files:**
- Create: `apps/app/lib/review/channel.ts`
- Test: `apps/app/lib/review/channel.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/app/lib/review/channel.test.ts
import { describe, it, expect } from "vitest";
import { resolveChannel } from "./channel";

describe("resolveChannel", () => {
  it("prefers the campaign channel", () => {
    expect(resolveChannel("facebook-post", "LinkedIn", "twitter")).toBe("LinkedIn");
  });
  it("falls back to metadata channel when no campaign channel", () => {
    expect(resolveChannel("email", null, "Instagram")).toBe("Instagram");
  });
  it("derives from the type prefix as a last resort", () => {
    expect(resolveChannel("linkedin-post", null, undefined)).toBe("linkedin");
    expect(resolveChannel("twitter-thread", null, null)).toBe("twitter");
    expect(resolveChannel("facebook-post", null, null)).toBe("facebook");
  });
  it("returns null when nothing resolves", () => {
    expect(resolveChannel("tagline", null, null)).toBeNull();
    expect(resolveChannel("email", null, "  ")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/app exec vitest run lib/review/channel.test.ts`
Expected: FAIL — cannot find module `./channel`.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/app/lib/review/channel.ts

/** Map a content-piece `type` to a platform when the type encodes one. */
function channelFromType(type: string): string | null {
  if (type.startsWith("linkedin")) return "linkedin";
  if (type.startsWith("twitter")) return "twitter";
  if (type.startsWith("facebook")) return "facebook";
  return null;
}

/**
 * Resolve the platform for a content piece.
 * Precedence: campaign channel → metadata channel → derived from type → null.
 */
export function resolveChannel(
  type: string,
  campaignChannel?: string | null,
  metadataChannel?: string | null,
): string | null {
  const campaign = campaignChannel?.trim();
  if (campaign) return campaign;
  const meta = metadataChannel?.trim();
  if (meta) return meta;
  return channelFromType(type);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/app exec vitest run lib/review/channel.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/app/lib/review/channel.ts apps/app/lib/review/channel.test.ts
git commit -m "feat(app): resolveChannel helper for review cards"
```

---

### Task 2: Carry `channel` on `ReviewCard`

Wire the helper into the server action so each card knows its platform.

**Files:**
- Modify: `apps/app/server/actions/review.ts:7-58`

- [ ] **Step 1: Add `channel` to the `ReviewCard` interface**

In the `ReviewCard` interface (currently lines 7-16), add after `avatarName`:

```ts
  channel: string | null;
```

- [ ] **Step 2: Fetch campaign channel + metadata in the query**

Replace the `.select(...)` template in `getReviewDeck` (currently lines 30-37) with one that also pulls `metadata` and the embedded campaign channel:

```ts
    .select(`
      id, type, title, body, image_url, product_id, metadata,
      products(name),
      avatars(name),
      campaigns(channel)
    `)
```

- [ ] **Step 3: Resolve and return the channel in the map**

Add the import at the top of the file (next to the existing `reject-reasons` import):

```ts
import { resolveChannel } from "@/lib/review/channel";
```

In the `.map(...)` callback, add alongside the existing `product`/`avatar` reads:

```ts
    const campaign = p.campaigns as { channel: string } | null;
    const metadata = p.metadata as { channel?: string } | null;
```

and add to the returned object (after `avatarName`):

```ts
      channel: resolveChannel(
        p.type as string,
        campaign?.channel ?? null,
        metadata?.channel ?? null,
      ),
```

- [ ] **Step 4: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean (no errors).

- [ ] **Step 5: Commit**

```bash
git add apps/app/server/actions/review.ts
git commit -m "feat(app): carry platform channel on review cards"
```

---

### Task 3: Platform icons on `ChannelPill`

Add inline-SVG platform glyphs to the shared pill (also improves Content/Campaigns pages — intended).

**Files:**
- Modify: `apps/app/components/pills.tsx:1-41`

- [ ] **Step 1: Add an icon map + lookup above `getChannelStyle`**

Insert after the `channelStyles` map (after current line 24), before `getChannelStyle`:

```tsx
// ── Channel platform icons (brand glyphs) ────────────
function icon(path: string) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden>
      <path d={path} />
    </svg>
  );
}

const channelIcons: Record<string, React.ReactNode> = {
  facebook: icon("M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"),
  meta: icon("M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"),
  linkedin: icon("M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"),
  "linkedin ads": icon("M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"),
  twitter: icon("M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z"),
  x: icon("M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z"),
  "x / twitter": icon("M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z"),
  "x/twitter": icon("M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z"),
  instagram: icon("M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.4-10.4a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44z"),
  youtube: icon("M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3 3 0 0 0 2.12-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6z"),
  tiktok: icon("M16.6 5.82a4.28 4.28 0 0 1-1.01-2.82h-3.3v13.18a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .76-5.06v-3.36a5.92 5.92 0 0 0-.76-.05 5.95 5.95 0 1 0 5.95 5.95V8.99a7.56 7.56 0 0 0 4.4 1.41V7.1a4.28 4.28 0 0 1-3.45-1.28z"),
  pinterest: icon("M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.43.22-.93 1.4-5.95 1.4-5.95s-.36-.72-.36-1.78c0-1.66.97-2.9 2.17-2.9 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 4-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.4 2.55-5.4 5.19 0 1.03.4 2.13.9 2.73a.36.36 0 0 1 .08.34c-.09.38-.3 1.19-.34 1.35-.05.22-.18.27-.41.16-1.52-.71-2.47-2.92-2.47-4.7 0-3.83 2.78-7.35 8.02-7.35 4.21 0 7.48 3 7.48 7.01 0 4.18-2.64 7.55-6.3 7.55-1.23 0-2.39-.64-2.79-1.4l-.76 2.89c-.27 1.06-1.01 2.38-1.5 3.19A12 12 0 1 0 12 0z"),
  reddit: icon("M24 11.78a2.46 2.46 0 0 0-2.46-2.46c-.67 0-1.27.27-1.71.7a12.06 12.06 0 0 0-6.32-1.99l1.08-5.06 3.52.75a1.76 1.76 0 1 0 .18-.84l-3.92-.83a.42.42 0 0 0-.5.32l-1.2 5.66a12.1 12.1 0 0 0-6.42 1.99 2.46 2.46 0 1 0-2.71 4.04 4.84 4.84 0 0 0-.06.74c0 3.77 4.39 6.83 9.81 6.83s9.81-3.06 9.81-6.83c0-.25-.02-.49-.06-.73A2.46 2.46 0 0 0 24 11.78zM6.67 13.54a1.76 1.76 0 1 1 3.52 0 1.76 1.76 0 0 1-3.52 0zm9.81 4.64c-1.2 1.2-3.5 1.29-4.18 1.29s-2.98-.09-4.18-1.29a.46.46 0 0 1 .65-.65c.76.76 2.37.97 3.53.97s2.78-.21 3.53-.97a.46.46 0 0 1 .65.65zm-.31-2.88a1.76 1.76 0 1 1 0-3.52 1.76 1.76 0 0 1 0 3.52z"),
};

function getChannelIcon(channel: string): React.ReactNode {
  return channelIcons[channel.toLowerCase()] ?? null;
}
```

- [ ] **Step 2: Render the icon inside `ChannelPill`**

Replace the `ChannelPill` component (current lines 33-41) with:

```tsx
export function ChannelPill({ channel }: { channel: string }) {
  const glyph = getChannelIcon(channel);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getChannelStyle(channel)}`}
    >
      {glyph}
      {channel}
    </span>
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean. (`React` is already in scope via the JSX runtime; if the typecheck complains about the `React.ReactNode` type, add `import type { ReactNode } from "react";` and use `ReactNode` instead.)

- [ ] **Step 4: Manual check**

In the running dev server (`http://localhost:3001`), open `/content` — channel pills now show a brand glyph beside the label; non-platform channels (e.g. "Blog / SEO", "Email") show no glyph and look unchanged.

- [ ] **Step 5: Commit**

```bash
git add apps/app/components/pills.tsx
git commit -m "feat(app): platform icons on ChannelPill"
```

---

### Task 4: Rebuild `PostCard` to Layout A (product-led header)

**Files:**
- Modify: `apps/app/components/review/post-card.tsx` (full rewrite)

- [ ] **Step 1: Replace the component**

Replace the entire contents of `apps/app/components/review/post-card.tsx` with:

```tsx
import type { ReviewCard } from "@/server/actions/review";
import { ChannelPill, TypePill } from "@/components/pills";

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
      {/* Header: product (left) · platform (right) */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-content-primary">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
          <span className="truncate">{card.productName}</span>
        </span>
        {card.channel && <ChannelPill channel={card.channel} />}
      </div>

      {/* Image / gradient */}
      <div
        className="h-40 overflow-hidden rounded-xl"
        style={{ background: gradientFor(card.id) }}
      >
        {card.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />
        )}
      </div>

      {/* Meta: type (left) · target avatar (right) */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <TypePill type={card.type} />
        {card.avatarName && (
          <span className="truncate text-[11px] text-content-muted">For · {card.avatarName}</span>
        )}
      </div>

      {/* Title + body */}
      {card.title && <p className="mt-3 text-sm font-semibold text-content-primary">{card.title}</p>}
      <p className="mt-1 line-clamp-4 text-sm text-content-secondary">{card.body}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean.

- [ ] **Step 3: Manual check**

In `http://localhost:3001/review`: each card shows product (dot + name) top-left, platform pill with icon top-right (when known), type pill + "For · {avatar}" under the image, then title + body. The raw `facebook-post` text is gone (now "Facebook Post" via TypePill).

- [ ] **Step 4: Commit**

```bash
git add apps/app/components/review/post-card.tsx
git commit -m "feat(app): product-led review card layout"
```

---

### Task 5: Recessed dim deck stacking

**Files:**
- Modify: `packages/ui/src/swipe/swipe-deck.tsx:74-81`

- [ ] **Step 1: Restyle the peek cards**

Replace the peek-card map block (current lines 74-81) with one that recedes via larger offset/scale, reduced opacity, and a softer border:

```tsx
        {peek.map((item, i) => (
          <div
            key={keyFor(item)}
            aria-hidden
            className="absolute inset-0 rounded-2xl border border-line/60 bg-surface-card"
            style={{
              transform: `translateY(${(i + 1) * 14}px) scale(${1 - (i + 1) * 0.06})`,
              opacity: 1 - (i + 1) * 0.4,
              zIndex: 0,
            }}
          />
        ))}
```

- [ ] **Step 2: Verify UI package types compile**

Run: `pnpm --filter @repo/ui typecheck`
Expected: clean.

- [ ] **Step 3: Verify swipe gesture tests still pass**

Run: `pnpm --filter @repo/ui test`
Expected: PASS (existing gesture tests unaffected).

- [ ] **Step 4: Manual check**

In `http://localhost:3001/review`: the cards behind the top card now clearly recede (smaller, dimmer, set back). Drag the top card and confirm tilting reveals receding shadow cards rather than an identically-coloured twin bleeding out the side.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/swipe/swipe-deck.tsx
git commit -m "feat(ui): recessed dim-deck stacking for swipe cards"
```

---

## Final verification

- [ ] Run full app + ui test suites: `pnpm --filter @repo/app test && pnpm --filter @repo/ui test` → all green.
- [ ] Run typecheck: `pnpm --filter @repo/app typecheck && pnpm --filter @repo/ui typecheck` → clean.
- [ ] Manual walk-through of `/review` and `/content` per the per-task manual checks above.
