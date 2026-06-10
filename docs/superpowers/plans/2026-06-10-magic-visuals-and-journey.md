# Magic Flow v2 — Journey Rebuild + AI Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rebuild the wait journey (informative, interactive, forced swipe, no dead gate) and add **art-directed** AI-generated post images that fire after email capture — quality bar: professional, never "AI slop."

**Architecture:** All in `apps/marketing`. Front-end: rewrite `StoryCarousel`, wire progressive image loading into the reveal. Back-end: Claude emits a per-post `imagePrompt` + a brand `visualStyle`; a new per-post `/api/magic/visuals` endpoint (gated to unlocked leads) composes an art-directed prompt and calls `gpt-image-1`, uploads to a public `magic-images` Supabase bucket, persists the URL on the lead row, and returns it. Reveal lazy-loads one image per post in parallel with a shimmer, falling back to the existing gradient if generation is unavailable or fails. Pure logic (prompt composition, style selection, swipe-gate state) is TDD'd in `lib/`; React components are verified by `pnpm typecheck`/`lint`/`build` + a manual run (no component-test infra).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind, Vitest 4 (node), Anthropic SDK, **OpenAI SDK (new dep)**, Supabase Storage.

**Supersedes** parts of `docs/superpowers/specs/2026-06-10-magic-flow-redesign-design.md`: decision #3 is now **AI-generate after email** (was code-built gradients); the journey is rebuilt per James's clarification (info screens + forced swipe).

**Conventions:**
- Run from `C:\Users\James\OneDrive\Documents\Marketing Machine\apps\marketing` unless noted.
- Single test: `pnpm exec vitest run lib/magic/<file>.test.ts` · All: `pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm build`
- Branch from `main` first: `git checkout -b feat/magic-visuals-journey`

**Quality bar (non-negotiable):** AI images must look professionally art-directed. The prompt-composition module is the lever; see Task 4.

---

## File Structure

**New**
- `lib/magic/image-style.ts` — curated art-direction styles + `buildImagePrompt` (the quality lever)
- `lib/magic/image-style.test.ts`
- `lib/magic/images.ts` — `gpt-image-1` call wrapper (mockable client)
- `lib/magic/images.test.ts`
- `lib/magic/swipe-gate.ts` — pure state for the forced left+right swipe
- `lib/magic/swipe-gate.test.ts`
- `app/api/magic/visuals/route.ts` — per-post image generation endpoint
- `components/magic/use-post-images.ts` — client hook: progressive per-post image loading
- `supabase/migrations/00027_magic_images_bucket.sql` — public `magic-images` bucket (repo root)

**Modify**
- `lib/magic/types.ts` — `MagicSamplePost.imagePrompt?`, `MagicSamplePost.imageUrl?`, `MagicBrand.visualStyle?`
- `lib/magic/generate.ts` — Claude emits `visualStyle` + per-post `imagePrompt`; `normaliseResult` carries/validates them
- `lib/magic/generate.test.ts` — assert new fields
- `lib/magic/store.ts` — `getLead` returns `email`; add `setPostImageUrl`, `uploadPostImage`
- `components/magic/branded-post.tsx` — render real image / shimmer / gradient fallback
- `components/magic/branded-post-carousel.tsx` — consume `use-post-images`
- `components/magic/reveal.tsx` — accept `id`, pass to carousel
- `components/magic/start-flow.tsx` — pass `id` to `Reveal`; pass `url` to `StoryCarousel`
- `components/magic/story-carousel.tsx` — full rebuild (info screens + forced swipe + no dead gate)
- `lib/magic/journey-cards.ts` — add a weak + strong example post for the forced swipe
- `apps/marketing/package.json` — add `openai`
- `apps/marketing/.env.example` (create if absent) — document `OPENAI_API_KEY`

---

## Task 1: Types for image prompts, URLs, and visual style

**Files:** Modify `lib/magic/types.ts`

- [ ] **Step 1: Extend the interfaces**

```ts
export interface MagicBrand {
  name: string;
  tagline: string;
  tone: string[];
  palette: string[];
  logoUrl?: string;
  positioning: string;
  /** Curated art-direction style key (see lib/magic/image-style.ts). */
  visualStyle?: string;
}

export interface MagicSamplePost {
  platform: string;
  caption: string;
  hashtags: string[];
  engagement: { likes: number; comments: number; shares: number };
  /** Concrete, art-directable image subject for this post (no text/logos). */
  imagePrompt?: string;
  /** Populated after AI generation (post-email). Absent → render gradient fallback. */
  imageUrl?: string;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck` — expect PASS (additive optional fields).

- [ ] **Step 3: Commit**

```bash
git add apps/marketing/lib/magic/types.ts
git commit -m "feat(magic): add imagePrompt/imageUrl/visualStyle to result types"
```

---

## Task 2: Art-direction styles + prompt composition (the quality lever)

**Files:** Create `lib/magic/image-style.ts`, `lib/magic/image-style.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/magic/image-style.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildImagePrompt, VISUAL_STYLES, VISUAL_STYLE_KEYS, DEFAULT_STYLE_KEY } from "./image-style";

describe("buildImagePrompt", () => {
  it("includes the chosen style direction, subject, brand colours and negative constraints", () => {
    const p = buildImagePrompt({
      styleKey: "editorial_product",
      brandColors: ["#0d9488", "#155e75"],
      subject: "a ceramic coffee cup on a linen surface",
    });
    expect(p).toContain(VISUAL_STYLES.editorial_product.direction);
    expect(p).toContain("a ceramic coffee cup on a linen surface");
    expect(p).toContain("#0d9488");
    expect(p.toLowerCase()).toContain("no text");
  });

  it("falls back to the default style for an unknown key", () => {
    const p = buildImagePrompt({ styleKey: "does-not-exist", subject: "x" });
    expect(p).toContain(VISUAL_STYLES[DEFAULT_STYLE_KEY].direction);
  });

  it("omits the colour clause when no colours are given", () => {
    const p = buildImagePrompt({ styleKey: "minimal_render", subject: "x" });
    expect(p).not.toContain("brand palette");
  });

  it("exposes the style keys for the generator to choose from", () => {
    expect(VISUAL_STYLE_KEYS).toEqual(Object.keys(VISUAL_STYLES));
    expect(VISUAL_STYLE_KEYS).toContain(DEFAULT_STYLE_KEY);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`Cannot find module './image-style'`)

Run: `pnpm exec vitest run lib/magic/image-style.test.ts`

- [ ] **Step 3: Implement `lib/magic/image-style.ts`**

```ts
// Art direction for AI post images. This file is the quality lever — tune the
// style directions / quality / negative constraints here after seeing real output.

export interface VisualStyle {
  key: string;
  label: string;
  /** Tone/industry hint so the generator can pick the right style. */
  bestFor: string;
  /** The art-direction fragment injected into the image prompt. */
  direction: string;
}

export const VISUAL_STYLES: Record<string, VisualStyle> = {
  editorial_product: {
    key: "editorial_product",
    label: "Editorial product photography",
    bestFor: "products, ecommerce, food, physical goods, premium brands",
    direction:
      "Premium editorial product photography. Soft natural window light, shallow depth of field, clean uncluttered background, generous negative space, high-end magazine quality.",
  },
  minimal_render: {
    key: "minimal_render",
    label: "Minimal 3D render",
    bestFor: "software, SaaS, apps, tech, fintech, abstract services",
    direction:
      "Minimal soft 3D render. Smooth matte geometric shapes, studio softbox lighting, gentle long shadows, abundant negative space, modern and clean — premium tech brand visual.",
  },
  lifestyle_candid: {
    key: "lifestyle_candid",
    label: "Lifestyle candid",
    bestFor: "services, wellness, communities, consumer brands, people-led",
    direction:
      "Authentic lifestyle photography, a candid unstaged moment, warm natural light, shallow depth of field, premium brand-campaign quality.",
  },
  bold_graphic: {
    key: "bold_graphic",
    label: "Bold graphic / abstract",
    bestFor: "bold or playful brands, agencies, media, events",
    direction:
      "Bold modern graphic composition, confident geometric forms, strong intentional use of the brand colours, contemporary and gallery-quality art direction.",
  },
  styled_flatlay: {
    key: "styled_flatlay",
    label: "Styled flat-lay",
    bestFor: "lifestyle goods, beauty, stationery, food, curated products",
    direction:
      "Overhead styled flat-lay, tastefully arranged objects on a clean surface, soft even daylight, considered composition and props, premium editorial quality.",
  },
};

export const VISUAL_STYLE_KEYS = Object.keys(VISUAL_STYLES);
export const DEFAULT_STYLE_KEY = "minimal_render";

const QUALITY =
  "Professional, polished, high production value. Tasteful, minimal and intentional. Photorealistic where photographic; crisp and well-composed.";
const NEGATIVE =
  "No text, no words, no letters, no captions, no logos, no watermarks, no UI or app screenshots, no charts or graphs. Avoid distorted faces or hands and prefer no visible human faces. Not oversaturated, not cluttered, no cheesy generic stock-photo look.";

export function buildImagePrompt(opts: {
  styleKey?: string;
  brandColors?: string[];
  subject: string;
}): string {
  const style = VISUAL_STYLES[opts.styleKey ?? ""] ?? VISUAL_STYLES[DEFAULT_STYLE_KEY];
  const colours =
    opts.brandColors && opts.brandColors.length
      ? `Use the brand palette as the dominant colour story: ${opts.brandColors.slice(0, 3).join(", ")}.`
      : "";
  return [style.direction, `Subject: ${opts.subject}.`, colours, QUALITY, NEGATIVE]
    .filter(Boolean)
    .join(" ");
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `pnpm exec vitest run lib/magic/image-style.test.ts`

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/image-style.ts apps/marketing/lib/magic/image-style.test.ts
git commit -m "feat(magic): art-directed image prompt composition"
```

---

## Task 3: Claude emits visualStyle + per-post imagePrompt

**Files:** Modify `lib/magic/generate.ts`, `lib/magic/generate.test.ts`

- [ ] **Step 1: Update tests**

In `lib/magic/generate.test.ts`, update `VALID_JSON` to include the new fields and add assertions. Change the `brand` block to include `visualStyle` and each `samplePosts` entry to include `imagePrompt`:

```ts
const VALID_JSON = JSON.stringify({
  brand: {
    name: "Northwind",
    tagline: "Reclaim your weekends",
    tone: ["calm", "friendly"],
    palette: ["#10b981", "#34d399"],
    positioning: "Automation for busy founders.",
    visualStyle: "minimal_render",
  },
  avatars: [
    { name: "Maya", role: "Solo founder", painPoints: ["No time"], channels: ["Instagram"] },
  ],
  samplePosts: [
    { platform: "Instagram", caption: "Reclaim your weekends.", hashtags: ["#worklife"], engagement: { likes: 200, comments: 12, shares: 5 }, imagePrompt: "a calm tidy desk at golden hour" },
  ],
});
```

Add a test:

```ts
  it("carries visualStyle and per-post imagePrompt through", async () => {
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(VALID_JSON));
    expect(result.brand.visualStyle).toBe("minimal_render");
    expect(result.samplePosts[0].imagePrompt).toBe("a calm tidy desk at golden hour");
  });

  it("falls back to a valid default style when the model omits/invents one", async () => {
    const bad = JSON.parse(VALID_JSON);
    bad.brand.visualStyle = "not_a_real_style";
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(JSON.stringify(bad)));
    expect(VISUAL_STYLE_KEYS).toContain(result.brand.visualStyle);
  });
```

Add the import at the top of the test file:

```ts
import { VISUAL_STYLE_KEYS } from "./image-style";
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm exec vitest run lib/magic/generate.test.ts`

- [ ] **Step 3: Update the prompt + normalise in `lib/magic/generate.ts`**

Add import at top:

```ts
import { VISUAL_STYLE_KEYS, DEFAULT_STYLE_KEY, VISUAL_STYLES } from "./image-style";
```

In `buildMagicPrompt`, append style guidance before the JSON shape. Insert into INSTRUCTIONS a new point and extend the sample-post instruction:

```ts
5. Choose ONE "visualStyle" for the brand from this exact list (pick the best fit): ${VISUAL_STYLE_KEYS.map((k) => `"${k}" (${VISUAL_STYLES[k].bestFor})`).join("; ")}.
6. For EACH sample post, also write an "imagePrompt": a short, concrete description of a single photographable/renderable SUBJECT or scene that suits the post and brand. Describe only the subject and setting — NO text, NO logos, NO people's faces, NO app screenshots.
```

Update the JSON shape in the prompt to include the new fields:

```ts
{
  "brand": { "name": "", "tagline": "", "tone": ["",""], "palette": ["#hex"], "positioning": "", "visualStyle": "minimal_render" },
  "avatars": [ { "name": "", "role": "", "painPoints": ["",""], "channels": ["",""] } ],
  "samplePosts": [ { "platform": "", "caption": "", "hashtags": ["#tag"], "engagement": { "likes": 0, "comments": 0, "shares": 0 }, "imagePrompt": "" } ]
}
```

In `normaliseResult`, add `visualStyle` to the brand (validated against the curated list) and carry `imagePrompt` on each post:

```ts
      logoUrl: raw.brand?.logoUrl || signals.logoUrl,
      positioning: raw.brand?.positioning || "",
      visualStyle: VISUAL_STYLE_KEYS.includes(raw.brand?.visualStyle ?? "")
        ? (raw.brand!.visualStyle as string)
        : DEFAULT_STYLE_KEY,
```

And map sample posts so `imagePrompt` survives (replace the `samplePosts:` line):

```ts
    samplePosts: Array.isArray(raw.samplePosts)
      ? raw.samplePosts.map((p) => ({
          platform: p.platform,
          caption: p.caption,
          hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
          engagement: p.engagement ?? { likes: 0, comments: 0, shares: 0 },
          imagePrompt: typeof p.imagePrompt === "string" ? p.imagePrompt : undefined,
        }))
      : [],
```

- [ ] **Step 4: Run — expect PASS** (`pnpm exec vitest run lib/magic/generate.test.ts`)

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/generate.ts apps/marketing/lib/magic/generate.test.ts
git commit -m "feat(magic): generate visualStyle + per-post imagePrompt"
```

---

## Task 4: OpenAI image generation wrapper

**Files:** add `openai` dep; create `lib/magic/images.ts`, `lib/magic/images.test.ts`

- [ ] **Step 1: Add the dependency**

From repo root: `pnpm add openai --filter @repo/marketing`
Verify it appears in `apps/marketing/package.json` dependencies.

- [ ] **Step 2: Write the failing tests**

Create `lib/magic/images.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import type OpenAI from "openai";
import { generateImageBase64 } from "./images";

function mockClient(b64: string | null) {
  return {
    images: {
      generate: vi.fn().mockResolvedValue({ data: b64 ? [{ b64_json: b64 }] : [] }),
    },
  } as unknown as OpenAI;
}

describe("generateImageBase64", () => {
  it("returns the base64 image from gpt-image-1", async () => {
    const out = await generateImageBase64("a tidy desk", mockClient("AAAA"));
    expect(out).toBe("AAAA");
  });

  it("returns null when the API yields no image", async () => {
    expect(await generateImageBase64("x", mockClient(null))).toBeNull();
  });

  it("returns null (never throws) when the API errors", async () => {
    const client = { images: { generate: vi.fn().mockRejectedValue(new Error("boom")) } } as unknown as OpenAI;
    expect(await generateImageBase64("x", client)).toBeNull();
  });

  it("requests gpt-image-1 at high quality, square", async () => {
    const client = mockClient("AAAA");
    await generateImageBase64("a tidy desk", client);
    const call = (client.images.generate as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.model).toBe("gpt-image-1");
    expect(call.quality).toBe("high");
    expect(call.size).toBe("1024x1024");
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

Run: `pnpm exec vitest run lib/magic/images.test.ts`

- [ ] **Step 4: Implement `lib/magic/images.ts`**

```ts
import OpenAI from "openai";

/**
 * Generate one image with gpt-image-1. Returns base64 PNG, or null on any
 * failure (caller falls back to the gradient — the reveal must never break).
 */
export async function generateImageBase64(
  prompt: string,
  client: OpenAI = new OpenAI(),
): Promise<string | null> {
  try {
    const res = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
    });
    return res.data?.[0]?.b64_json ?? null;
  } catch (err) {
    console.error("magic image generation failed:", err);
    return null;
  }
}
```

- [ ] **Step 5: Run — expect PASS** (`pnpm exec vitest run lib/magic/images.test.ts`)

- [ ] **Step 6: Commit**

```bash
git add apps/marketing/package.json apps/marketing/lib/magic/images.ts apps/marketing/lib/magic/images.test.ts ../../pnpm-lock.yaml
git commit -m "feat(magic): gpt-image-1 wrapper (high quality, resilient)"
```

> If `pnpm-lock.yaml` path differs, add the repo-root lockfile that changed.

---

## Task 5: Storage — bucket migration + store helpers

**Files:** Create `supabase/migrations/00027_magic_images_bucket.sql` (repo root); modify `lib/magic/store.ts`

- [ ] **Step 1: Create the bucket migration**

Create `supabase/migrations/00027_magic_images_bucket.sql`:

```sql
-- Public bucket for AI-generated magic post images (anonymous leads).
insert into storage.buckets (id, name, public)
values ('magic-images', 'magic-images', true)
on conflict (id) do nothing;

-- Public read; writes only via the service role (used server-side).
create policy "magic-images public read"
  on storage.objects for select
  using (bucket_id = 'magic-images');
```

> Service-role inserts bypass RLS, so no insert policy is needed. Apply via the project's normal migration path (or Supabase MCP `apply_migration`). The endpoint degrades gracefully if the bucket is missing (upload returns null → gradient fallback), so this migration is not a hard blocker for the rest of the tasks.

- [ ] **Step 2: Extend `lib/magic/store.ts`**

Add `email` to `getLead`'s select + return:

```ts
export async function getLead(
  id: string,
): Promise<{ sourceUrl: string; result: MagicResult; email: string | null } | null> {
  const { data, error } = await supabase
    .from("magic_leads")
    .select("source_url, result, email")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    sourceUrl: data.source_url,
    result: data.result as MagicResult,
    email: (data.email as string | null) ?? null,
  };
}
```

Add upload + persist helpers at the end of the file:

```ts
const IMAGE_BUCKET = "magic-images";

/** Upload a base64 PNG for a post; returns the public URL, or null on failure. */
export async function uploadPostImage(
  leadId: string,
  index: number,
  base64: string,
): Promise<string | null> {
  try {
    const buffer = Buffer.from(base64, "base64");
    const path = `${leadId}/${index}.png`;
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, buffer, { contentType: "image/png", upsert: true });
    if (error) {
      console.error("uploadPostImage error:", error);
      return null;
    }
    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?v=${index}`;
  } catch (err) {
    console.error("uploadPostImage threw:", err);
    return null;
  }
}

/** Persist a generated image URL onto a stored result's sample post. */
export async function setPostImageUrl(
  id: string,
  index: number,
  url: string,
): Promise<void> {
  const lead = await getLead(id);
  if (!lead) return;
  const posts = lead.result.samplePosts ?? [];
  if (!posts[index]) return;
  posts[index] = { ...posts[index], imageUrl: url };
  const { error } = await supabase
    .from("magic_leads")
    .update({ result: { ...lead.result, samplePosts: posts } })
    .eq("id", id);
  if (error) console.error("setPostImageUrl error:", error);
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck` — expect PASS. Run `pnpm test` to confirm existing store consumers (unlock route uses `getLead`) still typecheck/pass; the `email` field is additive.

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/lib/magic/store.ts supabase/migrations/00027_magic_images_bucket.sql
git commit -m "feat(magic): magic-images bucket + image persistence helpers"
```

---

## Task 6: Visuals endpoint

**Files:** Create `app/api/magic/visuals/route.ts`

- [ ] **Step 1: Implement the route**

```ts
import { NextResponse } from "next/server";
import { getLead, uploadPostImage, setPostImageUrl } from "@/lib/magic/store";
import { isRateLimited } from "@/lib/magic/rate-limit";
import { buildImagePrompt } from "@/lib/magic/image-style";
import { generateImageBase64 } from "@/lib/magic/images";

// gpt-image-1 at high quality can take a while.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { id?: string; postIndex?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, postIndex } = body;
  if (!id || typeof id !== "string" || typeof postIndex !== "number") {
    return NextResponse.json({ error: "Missing id/postIndex" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ imageUrl: null }, { status: 429 });
  }

  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Gate cost to real leads: images only generate once an email is attached.
  if (!lead.email) {
    return NextResponse.json({ error: "Locked" }, { status: 403 });
  }

  const post = lead.result.samplePosts?.[postIndex];
  if (!post) {
    return NextResponse.json({ error: "No such post" }, { status: 400 });
  }
  // Idempotent: already generated.
  if (post.imageUrl) {
    return NextResponse.json({ imageUrl: post.imageUrl });
  }
  // No API key configured → graceful fallback (client keeps the gradient).
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ imageUrl: null });
  }

  const prompt = buildImagePrompt({
    styleKey: lead.result.brand.visualStyle,
    brandColors: lead.result.brand.palette,
    subject: post.imagePrompt || post.caption,
  });

  const base64 = await generateImageBase64(prompt);
  if (!base64) return NextResponse.json({ imageUrl: null });

  const url = await uploadPostImage(id, postIndex, base64);
  if (!url) return NextResponse.json({ imageUrl: null });

  await setPostImageUrl(id, postIndex, url);
  return NextResponse.json({ imageUrl: url });
}
```

- [ ] **Step 2: Typecheck + build the route**

Run: `pnpm typecheck` then `pnpm build` — confirm the new route compiles. Expect PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/marketing/app/api/magic/visuals/route.ts
git commit -m "feat(magic): per-post AI image generation endpoint (gated to leads)"
```

---

## Task 7: Forced swipe-gate state (pure logic)

**Files:** Create `lib/magic/swipe-gate.ts`, `lib/magic/swipe-gate.test.ts`; modify `lib/magic/journey-cards.ts`

- [ ] **Step 1: Add the weak + strong example posts**

In `lib/magic/journey-cards.ts`, append:

```ts
export interface SwipeExample {
  /** "reject" → must swipe LEFT; "approve" → must swipe RIGHT. */
  expected: "reject" | "approve";
  platform: string;
  caption: string;
  gradient: string;
  /** One-line reason shown after they swipe correctly. */
  lesson: string;
}

/** The forced teaching beat: bin a weak post, approve a strong one. */
export const SWIPE_EXAMPLES: SwipeExample[] = [
  {
    expected: "reject",
    platform: "Instagram",
    caption: "BUY NOW!!! 50% OFF EVERYTHING!!! LINK IN BIO!!!",
    gradient: "linear-gradient(135deg, #71717a, #3f3f46)",
    lesson: "Spammy and off-brand — bin it. We never post like this.",
  },
  {
    expected: "approve",
    platform: "Instagram",
    caption: "The quiet win: a calmer week, because the busywork ran itself. ✨",
    gradient: "linear-gradient(135deg, #6366f1, #a855f7)",
    lesson: "On-brand, human, on-message — approve it. This is your voice.",
  },
];
```

- [ ] **Step 2: Write the failing tests**

Create `lib/magic/swipe-gate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isCorrectSwipe, nextGateIndex, isGateComplete } from "./swipe-gate";

describe("swipe gate", () => {
  it("accepts the correct direction for each example", () => {
    expect(isCorrectSwipe("reject", "left")).toBe(true);
    expect(isCorrectSwipe("reject", "right")).toBe(false);
    expect(isCorrectSwipe("approve", "right")).toBe(true);
    expect(isCorrectSwipe("approve", "left")).toBe(false);
  });

  it("advances only on a correct swipe and clamps at the end", () => {
    expect(nextGateIndex(0, true, 2)).toBe(1);
    expect(nextGateIndex(0, false, 2)).toBe(0); // wrong swipe → stay
    expect(nextGateIndex(1, true, 2)).toBe(2); // past last → complete sentinel
  });

  it("reports completion when index reaches the count", () => {
    expect(isGateComplete(2, 2)).toBe(true);
    expect(isGateComplete(1, 2)).toBe(false);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

Run: `pnpm exec vitest run lib/magic/swipe-gate.test.ts`

- [ ] **Step 4: Implement `lib/magic/swipe-gate.ts`**

```ts
export type SwipeDirection = "left" | "right";
export type SwipeExpectation = "reject" | "approve";

/** A swipe is correct when left==reject and right==approve. */
export function isCorrectSwipe(
  expected: SwipeExpectation,
  direction: SwipeDirection,
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

- [ ] **Step 5: Run — expect PASS** (`pnpm exec vitest run lib/magic/swipe-gate.test.ts`)

- [ ] **Step 6: Commit**

```bash
git add apps/marketing/lib/magic/swipe-gate.ts apps/marketing/lib/magic/swipe-gate.test.ts apps/marketing/lib/magic/journey-cards.ts
git commit -m "feat(magic): forced swipe-gate logic + weak/strong examples"
```

---

## Task 8: Rebuild StoryCarousel (info screens + forced swipe, no dead gate)

**Files:** Rewrite `components/magic/story-carousel.tsx`; modify `components/magic/start-flow.tsx`

- [ ] **Step 1: Pass `url` to StoryCarousel from start-flow**

In `components/magic/start-flow.tsx`, the `analysing` phase render becomes:

```tsx
  if (phase === "analysing") {
    return (
      <Centered>
        <StoryCarousel url={url} ready={ready} onDone={() => setPhase("emailGate")} />
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Centered>
    );
  }
```

(`url` state already exists in StartFlow.)

- [ ] **Step 2: Rewrite `components/magic/story-carousel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { SWIPE_EXAMPLES } from "@/lib/magic/journey-cards";
import {
  isCorrectSwipe,
  nextGateIndex,
  isGateComplete,
  type SwipeDirection,
} from "@/lib/magic/swipe-gate";

type Props = {
  url: string;
  /** True once the analysis result is ready. */
  ready: boolean;
  onDone: () => void;
};

const PAINS = [
  { emoji: "😮‍💨", title: "Posting consistently is brutal", body: "Most founders start strong, then go quiet for three weeks." },
  { emoji: "🤔", title: "You never know what to post", body: "Staring at a blank caption box is where momentum goes to die." },
  { emoji: "🔥", title: "Ads just burn cash", body: "Boosting posts and hoping isn't a strategy. It's a slow leak." },
];

// Steps: 0..2 pains, 3 swipe-intro, 4 swipe-gate, 5 finale.
const PAIN_COUNT = PAINS.length;
const STEP_SWIPE_INTRO = PAIN_COUNT;       // 3
const STEP_SWIPE_GATE = PAIN_COUNT + 1;    // 4
const STEP_FINALE = PAIN_COUNT + 2;        // 5

function hostname(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function StoryCarousel({ url, ready, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [gateIdx, setGateIdx] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const advance = () => setStep((s) => s + 1);
  const example = SWIPE_EXAMPLES[gateIdx];

  function onSwipe(direction: SwipeDirection) {
    const correct = isCorrectSwipe(example.expected, direction);
    if (!correct) {
      setFeedback(
        example.expected === "reject" ? "That one's spam — swipe left to bin it." : "That's a good one — swipe right to approve.",
      );
      return;
    }
    setFeedback(example.lesson);
    const next = nextGateIndex(gateIdx, true, SWIPE_EXAMPLES.length);
    setGateIdx(next);
    if (isGateComplete(next, SWIPE_EXAMPLES.length)) {
      setTimeout(advance, 600); // let the lesson register, then move on
    } else {
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Always-visible analysing status — work is happening from second one. */}
      <div className="mb-5 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-2 text-zinc-400">
          <span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-emerald-400" : "bg-indigo-400 animate-pulse"}`} />
          {ready ? "Analysis ready" : `Analysing ${hostname(url)}…`}
        </span>
        {ready && (
          <button type="button" onClick={onDone} aria-label="Skip to results" className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300 hover:bg-emerald-500/20">
            Skip to results ✨
          </button>
        )}
      </div>

      {step < PAIN_COUNT && (
        <div className="text-center">
          <div className="text-4xl">{PAINS[step].emoji}</div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">{PAINS[step].title}</h2>
          <p className="mt-3 text-zinc-400">{PAINS[step].body}</p>
          <button type="button" onClick={advance} className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
            {step === PAIN_COUNT - 1 ? "So here's the fix →" : "Next →"}
          </button>
          <p className="mt-4 text-xs text-zinc-600">{step + 1} / {PAIN_COUNT}</p>
        </div>
      )}

      {step === STEP_SWIPE_INTRO && (
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">This is how you'll run it 🔥</h2>
          <p className="mt-3 text-zinc-400">We draft everything. You just swipe — left to bin, right to approve. Try it on two now.</p>
          <button type="button" onClick={advance} className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
            Let's go →
          </button>
        </div>
      )}

      {step === STEP_SWIPE_GATE && example && (
        <div className="text-center">
          <p className="mb-3 text-sm text-zinc-400">
            {example.expected === "reject" ? "Swipe LEFT to bin this one 👎" : "Swipe RIGHT to approve this one 👍"}
          </p>
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-3 shadow-xl">
            <p className="mb-2 text-xs text-zinc-400">{example.platform}</p>
            <div className="h-40 rounded-xl" style={{ background: example.gradient }} />
            <p className="mt-3 text-sm text-zinc-200">{example.caption}</p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <button type="button" onClick={() => onSwipe("left")} aria-label="Swipe left to reject" className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-xl text-red-400 hover:bg-red-500/20">✗</button>
            <button type="button" onClick={() => onSwipe("right")} aria-label="Swipe right to approve" className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-xl text-emerald-400 hover:bg-emerald-500/25">♥</button>
          </div>
          {feedback && <p className="mt-3 text-sm text-indigo-300">{feedback}</p>}
          <p className="mt-3 text-xs text-zinc-600">{gateIdx + 1} / {SWIPE_EXAMPLES.length}</p>
        </div>
      )}

      {step >= STEP_FINALE && (
        <div className="text-center">
          {ready ? (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Your Brand DNA is ready ✨</h2>
              <p className="mt-3 text-zinc-400">That's exactly how the real thing works — let's see yours.</p>
              <button type="button" onClick={onDone} className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">See my Brand DNA →</button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Nice — you've got the hang of it</h2>
              <p className="mt-3 text-zinc-400">Just finishing your brand analysis. This jumps in automatically the moment it's done.</p>
              <div className="mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint` — expect PASS. (Confirm no unused imports from the old version; `nextIndex`/`JOURNEY_SAMPLE_POSTS` are no longer used here — that's fine, they remain used elsewhere/by tests.)

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/components/magic/story-carousel.tsx apps/marketing/components/magic/start-flow.tsx
git commit -m "feat(magic): rebuild wait journey — pain screens + forced swipe, no dead gate"
```

---

## Task 9: Progressive image loading into the reveal

**Files:** Create `components/magic/use-post-images.ts`; modify `branded-post.tsx`, `branded-post-carousel.tsx`, `reveal.tsx`, `start-flow.tsx`

- [ ] **Step 1: Pass `id` to Reveal**

In `start-flow.tsx`, the reveal render:

```tsx
      {result && id && <Reveal result={result} id={id} />}
```

- [ ] **Step 2: Create the loader hook `components/magic/use-post-images.ts`**

```ts
"use client";

import { useEffect, useState } from "react";
import type { MagicSamplePost } from "@/lib/magic/types";

export type PostImageState = { url?: string; loading: boolean };

/**
 * After unlock, request one AI image per post (in parallel). Posts that already
 * have an imageUrl are used as-is. A null response leaves the post imageless
 * (the card falls back to its gradient). Fires once per id.
 */
export function usePostImages(id: string, posts: MagicSamplePost[]): PostImageState[] {
  const [states, setStates] = useState<PostImageState[]>(() =>
    posts.map((p) => ({ url: p.imageUrl, loading: !p.imageUrl })),
  );

  useEffect(() => {
    let cancelled = false;
    posts.forEach((p, index) => {
      if (p.imageUrl) return;
      fetch("/api/magic/visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, postIndex: index }),
      })
        .then((r) => r.json())
        .then((data: { imageUrl?: string | null }) => {
          if (cancelled) return;
          setStates((prev) => {
            const next = [...prev];
            next[index] = { url: data.imageUrl ?? undefined, loading: false };
            return next;
          });
        })
        .catch(() => {
          if (cancelled) return;
          setStates((prev) => {
            const next = [...prev];
            next[index] = { url: undefined, loading: false };
            return next;
          });
        });
    });
    return () => {
      cancelled = true;
    };
    // Fire once per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return states;
}
```

- [ ] **Step 3: `branded-post.tsx` renders image / shimmer / gradient**

Add two optional props and use them for the image block. Update the component signature:

```tsx
export function BrandedPost({
  post,
  brand,
  imageUrl,
  loading = false,
}: {
  post: MagicSamplePost;
  brand: MagicBrand;
  imageUrl?: string;
  loading?: boolean;
}) {
```

Replace the image `div` (the `relative h-44` block) with:

```tsx
      <div className="relative h-44 w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : loading ? (
          <div className="h-full w-full animate-pulse bg-white/10" />
        ) : null}
        <span className="absolute bottom-2 right-3 text-xs font-semibold text-white/70">{brand.name}</span>
      </div>
```

- [ ] **Step 4: `branded-post-carousel.tsx` wires the hook**

Add `id` prop and use `usePostImages`:

```tsx
"use client";

import { useState } from "react";
import type { MagicBrand, MagicSamplePost } from "@/lib/magic/types";
import { nextIndex, prevIndex } from "@/lib/magic/carousel";
import { BrandedPost } from "./branded-post";
import { usePostImages } from "./use-post-images";

export function BrandedPostCarousel({
  posts,
  brand,
  id,
}: {
  posts: MagicSamplePost[];
  brand: MagicBrand;
  id: string;
}) {
  const [i, setI] = useState(0);
  const images = usePostImages(id, posts);
  if (!posts.length) return null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mx-auto max-w-sm">
        <BrandedPost post={posts[i]} brand={brand} imageUrl={images[i]?.url} loading={images[i]?.loading} />
      </div>
      {/* prev/dots/next block unchanged from current implementation */}
```

Keep the existing prev/dots/next markup below exactly as-is.

- [ ] **Step 5: `reveal.tsx` accepts + forwards `id`**

```tsx
export function Reveal({ result, id }: { result: MagicResult; id: string }) {
```

And pass it to the carousel:

```tsx
        <BrandedPostCarousel posts={result.samplePosts} brand={result.brand} id={id} />
```

- [ ] **Step 6: Typecheck, lint, build**

Run: `pnpm typecheck && pnpm lint && pnpm build` — expect PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/marketing/components/magic
git commit -m "feat(magic): progressive AI image loading on the reveal"
```

---

## Task 10: Full verification + docs + env

**Files:** `apps/marketing/.env.example`; `docs/native.md`

- [ ] **Step 1: Document the env var**

If `apps/marketing/.env.example` exists, add `OPENAI_API_KEY=sk-...  # Server-only. Magic flow AI post images.`; if it doesn't exist, create it with that line (plus a comment header). Do NOT touch `.env.local`.

- [ ] **Step 2: Full suite + build**

Run: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: all green. Test count = previous + new (image-style 4, images 4, swipe-gate 3, generate +2). Report the final number.

- [ ] **Step 3: Update `docs/native.md`**

Append under Stage 2, after the previous redesign note, before `### Stage 3`:

```markdown
- [x] **Magic flow v2 (2026-06-10)** — rebuilt the wait journey (pain-point info screens +
      a forced swipe-left/swipe-right teaching beat, no dead gate, skippable once ready) and
      added **art-directed** AI post images via `gpt-image-1`, generated after email capture
      (`/api/magic/visuals`, gated to leads, stored in the `magic-images` bucket) and
      progressively loaded on the reveal with a gradient fallback. Image art direction lives in
      `lib/magic/image-style.ts`. ⚠️ Needs `OPENAI_API_KEY` in the marketing env (local + Vercel)
      and the `magic-images` bucket migration applied. See
      `docs/superpowers/plans/2026-06-10-magic-visuals-and-journey.md`.
```

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/.env.example docs/native.md
git commit -m "docs(magic): record v2 visuals + journey; document OPENAI_API_KEY"
```

---

## Manual verification (James — requires browser + OPENAI_API_KEY + bucket)

These cannot be done by an agent:
1. Add `OPENAI_API_KEY` to `apps/marketing/.env.local`; apply the `magic-images` bucket migration.
2. `pnpm dev`, enter `automatedpanda.com` on the hero → confirm **one click** into the journey, "Analysing automatedpanda.com…" visible immediately (no dead gate). [#1]
3. Click through pain screens; at the swipe gate, confirm the wrong swipe is rejected with a nudge and only the correct left/right advances; confirm "Skip to results" appears once ready. [#2]
4. Enter email → on the reveal, confirm post images **generate and look genuinely good** (art-directed, on-brand colours, no garbled text). [#3 — the quality bar]
5. If the images look off, tune `lib/magic/image-style.ts` (style directions / quality / negatives) and re-test — that's the intended iteration loop.

---

## Self-Review (author)
- **#1 dead gate:** Task 8 — status line shows "Analysing …" from step 0; no hook gate. ✅
- **#2 journey:** Task 7 + 8 — pain screens, forced left/right swipe (wrong swipe blocked), skip-when-ready. ✅
- **#3 AI visuals (quality):** Tasks 2 (art direction), 3 (prompts), 4 (gen), 5 (storage), 6 (endpoint), 9 (progressive reveal). Gated to leads; graceful fallback. ✅
- **Placeholders:** none — full code/tests per step.
- **Types:** `visualStyle`/`imagePrompt`/`imageUrl` defined in Task 1, produced in Task 3, consumed in Tasks 6 & 9; `getLead` email field added in Task 5, used in Task 6; `usePostImages`/`BrandedPostCarousel`/`Reveal` prop additions threaded through Task 9.
- **Cost/perf:** one `gpt-image-1` call per post, parallel, only after email, idempotent (skips if `imageUrl` exists), per-IP rate-limited, `maxDuration 60`.
- **Resilience:** missing key / failed gen / missing bucket → `imageUrl: null` → gradient fallback; reveal never breaks.
