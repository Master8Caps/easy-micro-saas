# Images on Social Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let social posts carry images — Facebook/X/LinkedIn optionally, Instagram always — by decoupling "has an image" from the content type.

**Architecture:** Pure content-type/image-state helpers move to a testable `lib/content` module. A new `instagram-post` type is added. Content generation writes an optional image prompt per post (always for Instagram) and best-effort auto-generates the Instagram image; other images are generated on demand. The image-generator UI un-gates to all social posts, and the review card shows/generates images by image-state.

**Tech Stack:** Next.js 15 (App Router, server actions), React, TypeScript, Tailwind, Supabase, OpenAI `gpt-image-1`, Anthropic SDK, Vitest.

Spec: `docs/superpowers/specs/2026-06-16-social-post-images-design.md`

---

### Task 1: Pure content helpers (`lib/content/types.ts`)

Move the pure `mapContentType` out of the `"use server"` file (server-action files may only export async fns, so it can't be exported/tested in place) and add the social-type list + image-state helper. New mapping sends Instagram posts to `instagram-post`.

**Files:**
- Create: `apps/app/lib/content/types.ts`
- Test: `apps/app/lib/content/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/app/lib/content/types.test.ts
import { describe, it, expect } from "vitest";
import { mapContentType, isSocialPostType, imageState, SOCIAL_POST_TYPES } from "./types";

describe("mapContentType", () => {
  it("maps Instagram posts to instagram-post (text or image)", () => {
    expect(mapContentType("text-post", "Instagram")).toBe("instagram-post");
    expect(mapContentType("image-prompt", "Instagram")).toBe("instagram-post");
  });
  it("keeps Instagram video as video-script", () => {
    expect(mapContentType("video-script", "Instagram")).toBe("video-script");
  });
  it("maps other channels' text posts to their native type", () => {
    expect(mapContentType("text-post", "LinkedIn")).toBe("linkedin-post");
    expect(mapContentType("text-post", "Facebook")).toBe("facebook-post");
    expect(mapContentType("text-post", "X / Twitter")).toBe("twitter-post");
    expect(mapContentType("thread", "X")).toBe("twitter-thread");
  });
});

describe("isSocialPostType", () => {
  it("recognises social post types", () => {
    expect(isSocialPostType("instagram-post")).toBe(true);
    expect(isSocialPostType("facebook-post")).toBe(true);
    expect(isSocialPostType("image-prompt")).toBe(true);
    expect(isSocialPostType("email")).toBe(false);
    expect(isSocialPostType("tagline")).toBe(false);
  });
});

describe("imageState", () => {
  it("is ready when an image url exists", () => {
    expect(imageState("a prompt", "http://x/y.png")).toBe("ready");
    expect(imageState(null, "http://x/y.png")).toBe("ready");
  });
  it("is pending when only a prompt exists", () => {
    expect(imageState("a prompt", null)).toBe("pending");
  });
  it("is none when neither exists", () => {
    expect(imageState(null, null)).toBe("none");
    expect(imageState("", null)).toBe("none");
  });
});

describe("SOCIAL_POST_TYPES", () => {
  it("has unique entries and includes instagram-post", () => {
    expect(SOCIAL_POST_TYPES).toContain("instagram-post");
    expect(new Set(SOCIAL_POST_TYPES).size).toBe(SOCIAL_POST_TYPES.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/app exec vitest run lib/content/types.test.ts`
Expected: FAIL — cannot find module `./types`.

- [ ] **Step 3: Write the implementation**

```ts
// apps/app/lib/content/types.ts

/** Social post types that can carry an image and appear in the swipe review deck. */
export const SOCIAL_POST_TYPES = [
  "linkedin-post",
  "twitter-post",
  "twitter-thread",
  "facebook-post",
  "instagram-post",
  "image-prompt",
] as const;

const SOCIAL_SET = new Set<string>(SOCIAL_POST_TYPES);

export function isSocialPostType(type: string): boolean {
  return SOCIAL_SET.has(type);
}

/**
 * Resolve a campaign's (content_type, channel) to a stored content_pieces.type.
 * Instagram posts become the dedicated instagram-post type (always-image);
 * Instagram videos stay video-script.
 */
export function mapContentType(contentType: string, channel: string): string {
  const key = contentType.toLowerCase();
  const ch = channel.toLowerCase();

  if (ch.includes("instagram")) {
    if (key === "video-script") return "video-script";
    return "instagram-post";
  }
  if (key === "text-post") {
    if (ch.includes("email")) return "email";
    if (ch.includes("linkedin")) return "linkedin-post";
    if (ch.includes("twitter") || ch.includes("x")) return "twitter-post";
    if (ch.includes("facebook")) return "facebook-post";
    return "linkedin-post";
  }
  if (key === "thread") return "twitter-thread";
  if (key === "video-script") return "video-script";
  if (key === "image-prompt") return "image-prompt";
  if (key === "landing-page") return "landing-page-copy";
  if (key === "email") return "email";
  if (key === "ad-copy") return "ad-copy";
  return "linkedin-post";
}

export type ImageState = "ready" | "pending" | "none";

/** ready = has image; pending = has a prompt but no image yet; none = neither. */
export function imageState(
  imagePromptUsed: string | null,
  imageUrl: string | null,
): ImageState {
  if (imageUrl) return "ready";
  if (imagePromptUsed && imagePromptUsed.trim()) return "pending";
  return "none";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/app exec vitest run lib/content/types.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add apps/app/lib/content/types.ts apps/app/lib/content/types.test.ts
git commit -m "feat(app): content type helpers + instagram-post mapping"
```

---

### Task 2: DB migration — add `instagram-post` type

**Files:**
- Create: `supabase/migrations/00030_instagram_post_type.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================
-- Migration 00030: Add instagram-post content type
-- ============================================
-- Instagram posts are now a first-class type that always carries an image,
-- instead of collapsing into image-prompt.
-- ============================================

ALTER TABLE public.content_pieces DROP CONSTRAINT content_pieces_type_check;
ALTER TABLE public.content_pieces ADD CONSTRAINT content_pieces_type_check
  CHECK (type IN (
    'linkedin-post', 'twitter-post', 'twitter-thread',
    'facebook-post', 'instagram-post',
    'video-script', 'image-prompt',
    'landing-page-copy', 'email', 'ad-copy',
    'email-sequence', 'meta-description', 'tagline'
  ));
```

- [ ] **Step 2: Apply the migration to the live project**

The operator applies this to the "Micro Machine" Supabase project (`vvwuwqsaaviqgmxqsfsx`) via the Supabase MCP `apply_migration` (name: `instagram_post_type`) or `supabase db push`. The constraint is additive — existing rows are unaffected.

Verify: the new constraint allows `instagram-post` (a later manual test will insert one via generation).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00030_instagram_post_type.sql
git commit -m "feat(db): add instagram-post content type"
```

---

### Task 3: Wire generation to the helpers + write the image prompt

Swap `content.ts` to use the shared `mapContentType`, add an `image_prompt` field to the social generation output, and store it as `image_prompt_used`.

**Files:**
- Modify: `apps/app/server/actions/content.ts`

- [ ] **Step 1: Import the helper and delete the local copy**

At the top of `content.ts`, add to the imports:

```ts
import { mapContentType, isSocialPostType } from "@/lib/content/types";
```

Delete the local `function mapContentType(...) { ... }` block (currently lines 14-33). The call site at line 319 (`const contentPieceType = mapContentType(campaign.content_type, campaign.channel);`) now resolves to the imported version.

- [ ] **Step 2: Add the image-prompt instruction to `buildContentPrompt`**

In `buildContentPrompt`, immediately after `const formatInstructions = getFormatInstructions(...)`, add:

```ts
  const wantsInstagram = campaign.channel.toLowerCase().includes("instagram");
  const imageInstruction = isSocialPostType(contentPieceType)
    ? wantsInstagram
      ? `\n\nIMAGE: Every piece MUST include an "image_prompt" — a detailed image-generation brief (subject, style, mood, composition, colour palette, any text overlay). Instagram is visual-first.`
      : `\n\nIMAGE: For pieces where a strong visual would lift engagement, include an "image_prompt" — a detailed image-generation brief (subject, style, mood, composition, colour palette, any text overlay). Omit "image_prompt" entirely for pieces that work better as text only.`
    : "";
```

Then append `${imageInstruction}` into the prompt right after the `${formatInstructions}` line (line 151), so it reads:

```ts
CONTENT FORMAT: ${contentPieceType}
${formatInstructions}${imageInstruction}
```

And add the `image_prompt` field to the JSON example object (inside the `"pieces"` array, after the `"notes"` line):

```ts
      "notes": "Brief note on what makes this piece effective",
      "image_prompt": "Detailed image-generation brief — include per the IMAGE rule above, otherwise omit this field"
```

- [ ] **Step 3: Parse and store the image prompt**

Update the parsed output type (currently line 355-357) to include `image_prompt`:

```ts
    const output: {
      pieces: { content_type?: string; title: string; body: string; cta_text?: string; notes?: string; image_prompt?: string }[];
    } = JSON.parse(jsonMatch[0]);
```

In the `inserts` map (lines 387-401), add an `image_prompt_used` field to each insert object (after `status`):

```ts
      status: "draft" as const,
      image_prompt_used: piece.image_prompt?.trim() || null,
```

- [ ] **Step 4: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/app/server/actions/content.ts
git commit -m "feat(app): generate per-post image prompts (instagram always)"
```

---

### Task 4: Extract a reusable image render helper

Pull the OpenAI-call + storage-upload core out of `generateImage` so both the on-demand action and the Instagram auto-gen path share one code path.

**Files:**
- Modify: `apps/app/server/actions/images.ts`

- [ ] **Step 1: Add the exported render helper**

In `images.ts`, after the `getDefaultSize` function (line 29) and before `extractImagePrompt`, add:

```ts
/**
 * Render an image with gpt-image-1 and store it in the content-images bucket.
 * Returns the public URL (cache-busted). Throws on failure — callers decide
 * whether that is fatal (on-demand) or best-effort (auto-gen).
 */
export async function renderAndStoreImage(opts: {
  contentPieceId: string;
  productId: string;
  prompt: string;
  channel?: string;
  size?: ImageSize;
  quality?: ImageQuality;
}): Promise<string> {
  const size = opts.size ?? getDefaultSize(opts.channel);
  const quality = opts.quality ?? "medium";

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: opts.prompt,
    n: 1,
    size,
    quality,
  });
  const imageData = response.data?.[0]?.b64_json;
  if (!imageData) throw new Error("No image data returned");

  const serviceClient = createServiceClient();
  const storagePath = `${opts.productId}/${opts.contentPieceId}.png`;
  const buffer = Buffer.from(imageData, "base64");

  const { error: uploadError } = await serviceClient.storage
    .from("content-images")
    .upload(storagePath, buffer, { contentType: "image/png", upsert: true });
  if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

  const { data: urlData } = serviceClient.storage
    .from("content-images")
    .getPublicUrl(storagePath);
  return `${urlData.publicUrl}?v=${Date.now()}`;
}
```

- [ ] **Step 2: Refactor `generateImage` to use it**

In `generateImage`, replace the body from the `// Call GPT Image 1` comment through the `getPublicUrl` block (currently lines 77-123 — the `let imageBase64`, the OpenAI try/catch, the upload, and the public-URL derivation) with:

```ts
  let imageUrl: string;
  try {
    imageUrl = await renderAndStoreImage({
      contentPieceId,
      productId: piece.product_id as string,
      prompt,
      channel,
      size,
      quality,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Image generation failed";
    if (message.includes("content_policy") || message.includes("safety")) {
      throw new Error(
        "Image couldn't be generated due to content policy. Try adjusting the prompt."
      );
    }
    throw new Error(`Image generation failed: ${message}`);
  }
```

Note: `size` and `quality` are already computed above (lines 74-75); keep those lines. `piece` already selects `product_id` (line 61). The subsequent `content_pieces` update (line 126+) that sets `image_url`/`image_source`/`image_prompt_used` stays unchanged.

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/app/server/actions/images.ts
git commit -m "refactor(app): extract renderAndStoreImage helper"
```

---

### Task 5: Instagram auto-generation (best-effort)

After inserting generated pieces, generate the image for any `instagram-post` that has a prompt — without ever failing the overall generation.

**Files:**
- Modify: `apps/app/server/actions/content.ts`

- [ ] **Step 1: Import the render helper**

Add to the imports at the top of `content.ts`:

```ts
import { renderAndStoreImage } from "./images";
```

- [ ] **Step 2: Auto-generate after insert**

In `generateContentForCampaign`, immediately after the `if (insertError) return { error: insertError.message };` line (line 408) and before the "Auto-generate tracked links" block, add:

```ts
    // Best-effort: Instagram posts always carry an image — generate now.
    // Failures leave the piece "pending" (prompt set, no url); never block.
    if (savedPieces) {
      await Promise.allSettled(
        savedPieces
          .filter((p) => p.type === "instagram-post" && p.image_prompt_used)
          .map(async (p) => {
            const url = await renderAndStoreImage({
              contentPieceId: p.id,
              productId: input.productId,
              prompt: p.image_prompt_used as string,
              channel: campaign.channel,
            });
            await supabase
              .from("content_pieces")
              .update({ image_url: url, image_source: "generated" })
              .eq("id", p.id);
          }),
      );
    }
```

(The insert `.select(...)` at line 406 already returns `type` and `image_prompt_used`.)

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean.

- [ ] **Step 4: Manual check**

(Deferred to the final manual pass — requires generating an Instagram campaign end-to-end.)

- [ ] **Step 5: Commit**

```bash
git add apps/app/server/actions/content.ts
git commit -m "feat(app): auto-generate instagram post images"
```

---

### Task 6: Un-gate the image generator for all social posts

**Files:**
- Modify: `apps/app/app/(dashboard)/content/content-list.tsx:522`
- Modify: `apps/app/app/(dashboard)/campaigns/campaign-panel.tsx:350`

- [ ] **Step 1: content-list.tsx**

Add to the imports (alongside the existing `@/components/pills` import near the top):

```ts
import { isSocialPostType } from "@/lib/content/types";
```

Change the generator condition (line 522) from:

```tsx
                {isExpanded && piece.type === "image-prompt" && (
```

to:

```tsx
                {isExpanded && isSocialPostType(piece.type) && (
```

- [ ] **Step 2: campaign-panel.tsx**

Add the same import at the top of `campaign-panel.tsx`:

```ts
import { isSocialPostType } from "@/lib/content/types";
```

Change the condition (line 350) from:

```tsx
                        {piece.type === "image-prompt" && (
```

to:

```tsx
                        {isSocialPostType(piece.type) && (
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "apps/app/app/(dashboard)/content/content-list.tsx" "apps/app/app/(dashboard)/campaigns/campaign-panel.tsx"
git commit -m "feat(app): show image generator on all social posts"
```

---

### Task 7: Review deck — instagram-post, image state, generate button

**Files:**
- Modify: `apps/app/server/actions/review.ts`
- Modify: `apps/app/components/review/post-card.tsx`

- [ ] **Step 1: review.ts — use shared types, carry the prompt**

Replace the local `SOCIAL_REVIEW_TYPES` constant (added in the prior review-card work) with the shared list. At the top, add:

```ts
import { SOCIAL_POST_TYPES } from "@/lib/content/types";
```

Delete the local `const SOCIAL_REVIEW_TYPES = [ ... ];` block and change the query filter to use the shared list:

```ts
    .in("type", SOCIAL_POST_TYPES as unknown as string[])
```

Add `imagePromptUsed` to the `ReviewCard` interface (after `channel`):

```ts
  imagePromptUsed: string | null;
```

Add `image_prompt_used` to the `.select(...)` template (alongside `image_url`):

```ts
      id, type, title, body, image_url, image_prompt_used, product_id, metadata,
```

And return it in the `.map(...)` object (after `channel`):

```ts
      imagePromptUsed: (p.image_prompt_used as string | null) ?? null,
```

- [ ] **Step 2: post-card.tsx — render by image state + generate button**

Replace the contents of `apps/app/components/review/post-card.tsx` with:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { ReviewCard } from "@/server/actions/review";
import { ChannelPill, TypePill } from "@/components/pills";
import { imageState } from "@/lib/content/types";
import { generateImage } from "@/server/actions/images";

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
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  // Local image state so a freshly-generated image shows without a reload.
  const [imageUrl, setImageUrl] = useState<string | null>(card.imageUrl);
  const [generating, setGenerating] = useState(false);

  const state = imageState(card.imagePromptUsed, imageUrl);
  // Instagram always wants a visual; pending/ready always show the block.
  const showVisual = state !== "none" || card.type === "instagram-post";

  useEffect(() => {
    if (expanded) return;
    const el = bodyRef.current;
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [card.body, expanded, showVisual]);

  async function handleGenerate(e: React.PointerEvent) {
    e.stopPropagation();
    if (generating) return;
    setGenerating(true);
    try {
      const result = await generateImage(card.id);
      if (result?.imageUrl) setImageUrl(result.imageUrl);
    } catch {
      // generateImage throws on failure; leave the card pending so it can retry.
    } finally {
      setGenerating(false);
    }
  }

  const metaRow = (
    <div className="flex items-center justify-between gap-2">
      <TypePill type={card.type} />
      {card.avatarName && (
        <span className="truncate text-[11px] text-content-muted">For · {card.avatarName}</span>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-line bg-surface-tertiary p-4 shadow-xl">
      {/* Header: product (left) · platform (right) */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-content-primary">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
          <span className="truncate">{card.productName}</span>
        </span>
        {card.channel && <ChannelPill channel={card.channel} />}
      </div>

      {/* Visual block — image, or a pending placeholder with a generate button */}
      {showVisual && (
        <>
          <div
            className="relative mb-3 flex h-40 items-center justify-center overflow-hidden rounded-xl"
            style={{ background: gradientFor(card.id) }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />
            ) : (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => handleGenerate(e as unknown as React.PointerEvent)}
                disabled={generating}
                className="rounded-lg border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/40 disabled:opacity-60"
              >
                {generating ? "Generating…" : "Generate image"}
              </button>
            )}
          </div>
          <div className="mb-3">{metaRow}</div>
        </>
      )}

      {/* Title + body — body is the hero on text-only posts */}
      {card.title && (
        <p className={`font-semibold text-content-primary ${showVisual ? "text-sm" : "text-base"}`}>
          {card.title}
        </p>
      )}
      <p
        ref={bodyRef}
        className={`mt-1 whitespace-pre-wrap leading-relaxed text-content-secondary ${
          showVisual ? "text-sm" : "text-[15px]"
        } ${expanded ? "" : showVisual ? "line-clamp-4" : "line-clamp-6"}`}
      >
        {card.body}
      </p>

      {(overflowing || expanded) && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
        >
          {expanded ? "Show less ▴" : "Show more ▾"}
        </button>
      )}

      {/* Meta row sits at the bottom on text-only posts */}
      {!showVisual && <div className="mt-3">{metaRow}</div>}
    </div>
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/app/server/actions/review.ts apps/app/components/review/post-card.tsx
git commit -m "feat(app): review cards show + generate post images"
```

---

### Task 8: Labels + Metricool Instagram fix

**Files:**
- Modify: `apps/app/components/pills.tsx`
- Modify: `apps/app/lib/metricool/types.ts:60-67`

- [ ] **Step 1: Add the Instagram Post label**

In `pills.tsx`, in the `typeLabels` record (lines 44-57), add an entry (after `"facebook-post": "Facebook Post",`):

```ts
  "instagram-post": "Instagram Post",
```

- [ ] **Step 2: Fix the Metricool mapping**

In `apps/app/lib/metricool/types.ts`, in `CONTENT_TYPE_TO_NETWORK` (lines 60-67), replace the dead `"instagram-reel-caption"` key with the real type:

```ts
  "instagram-post": "INSTAGRAM",
```

(So the record reads `linkedin-post`, `twitter-post`, `twitter-thread`, `facebook-post`, `instagram-post`, `tiktok`.)

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/app/components/pills.tsx apps/app/lib/metricool/types.ts
git commit -m "feat(app): instagram-post label + metricool mapping"
```

---

### Task 9: Brain prompt — Instagram guidance

Stop telling the brain to force Instagram into `image-prompt`; let Instagram posts be text-posts (which `mapContentType` resolves to `instagram-post`, always-image) or video scripts.

**Files:**
- Modify: `apps/app/server/actions/brain.ts:426`

- [ ] **Step 1: Update the Instagram instruction**

Replace the rule on line 426:

```ts
6. For Instagram campaigns, ALWAYS use image-prompt or video-script content types (Instagram is visual-first — no text-only posts).`;
```

with:

```ts
6. For Instagram campaigns, use text-post or video-script content types — every Instagram post is visual-first and will carry an image, so no caption-only/text-only posts.`;
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm --filter @repo/app typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/app/server/actions/brain.ts
git commit -m "feat(app): brain treats instagram posts as image posts"
```

---

## Final verification

- [ ] Run unit + existing suites: `pnpm --filter @repo/app test && pnpm --filter @repo/ui test` → all green.
- [ ] Typecheck: `pnpm --filter @repo/app typecheck && pnpm --filter @repo/ui typecheck` → clean.
- [ ] Manual (dev server on 3001):
  - Generate an **Instagram** campaign → pieces are `instagram-post`, arrive **with images** (or "pending" with a Generate button if gen failed).
  - Generate a **Facebook** campaign → some pieces flagged pending (image prompt, no image), rest text-only.
  - On `/content`, expand a non-`image-prompt` social post → the **image generator** is available.
  - In `/review`, a pending card shows **"Generate image"**; clicking it produces the image inline.
  - Confirm the **"Instagram Post"** label + Instagram icon render on instagram-post cards.
