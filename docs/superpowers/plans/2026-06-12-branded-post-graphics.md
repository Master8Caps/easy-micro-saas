# Branded Post Graphics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AI-generated post imagery in the magic reveal with deterministic, code-rendered, platform-dependent "bold statement" graphics (brand colour + headline + logo).

**Architecture:** Two new pure helpers (`headline.ts`, `post-graphic-style.ts`) feed a new presentational component (`post-graphic.tsx`) that renders the graphic synchronously inside the existing `BrandedPost` card. The AI generation gains a `headline` field; the carousel stops fetching AI images, removing the post-reveal pop-in. Existing AI image machinery is left dormant.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind, Vitest. Run all commands from `apps/marketing/`.

---

## File structure

- **Create** `apps/marketing/lib/magic/headline.ts` — `deriveHeadline(caption)` fallback helper (pure).
- **Create** `apps/marketing/lib/magic/headline.test.ts` — its tests.
- **Create** `apps/marketing/lib/magic/post-graphic-style.ts` — `platformTheme(platform)` config (pure).
- **Create** `apps/marketing/lib/magic/post-graphic-style.test.ts` — its tests.
- **Create** `apps/marketing/components/magic/post-graphic.tsx` — the presentational graphic.
- **Modify** `apps/marketing/lib/magic/types.ts` — add `headline?` to `MagicSamplePost`.
- **Modify** `apps/marketing/lib/magic/generate.ts` — prompt + `normaliseResult` carry `headline` (with fallback).
- **Modify** `apps/marketing/lib/magic/generate.test.ts` — assert headline carry-through + fallback.
- **Modify** `apps/marketing/lib/magic/result-version.ts` — bump `RESULT_VERSION` 2 → 3.
- **Modify** `apps/marketing/lib/magic/result-version.test.ts` — lock the new version.
- **Modify** `apps/marketing/components/magic/branded-post.tsx` — render `PostGraphic`, drop `imageUrl`/`loading`.
- **Modify** `apps/marketing/components/magic/branded-post-carousel.tsx` — drop `usePostImages`/`id`.
- **Modify** `apps/marketing/components/magic/reveal.tsx` — drop `id`.
- **Modify** `apps/marketing/components/magic/start-flow.tsx` — drop `id` from the `<Reveal>` call.
- **Modify** `apps/marketing/components/magic/use-post-images.ts` — add a dormant-code note.

---

### Task 1: `deriveHeadline` fallback helper

**Files:**
- Create: `apps/marketing/lib/magic/headline.ts`
- Test: `apps/marketing/lib/magic/headline.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/marketing/lib/magic/headline.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deriveHeadline } from "./headline";

describe("deriveHeadline", () => {
  it("takes the first clause before sentence/clause punctuation", () => {
    expect(deriveHeadline("The quiet win: a calmer week, because the busywork ran itself. ✨")).toBe("The quiet win");
    expect(deriveHeadline("Your whole funnel — drafted while you sleep.")).toBe("Your whole funnel");
    expect(deriveHeadline("BUY NOW!!! 50% OFF EVERYTHING")).toBe("BUY NOW");
  });

  it("caps at six words", () => {
    expect(deriveHeadline("one two three four five six seven eight")).toBe("one two three four five six");
  });

  it("strips trailing emoji and punctuation", () => {
    expect(deriveHeadline("Ship faster 🚀")).toBe("Ship faster");
    expect(deriveHeadline("Grow your brand,")).toBe("Grow your brand");
  });

  it("returns empty string for empty input", () => {
    expect(deriveHeadline("")).toBe("");
    expect(deriveHeadline("   ")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/magic/headline.test.ts`
Expected: FAIL — "deriveHeadline is not a function" / module not found.

- [ ] **Step 3: Write minimal implementation**

Create `apps/marketing/lib/magic/headline.ts`:

```ts
// Emoji + symbol ranges we never want in a headline.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu;

/**
 * Fallback headline for the post graphic when generation didn't supply one.
 * First clause of the caption, emoji stripped, capped at six words.
 */
export function deriveHeadline(caption: string): string {
  const firstClause = caption.split(/[.!?:\n—]/)[0] ?? "";
  const words = firstClause.replace(EMOJI, "").trim().split(/\s+/).filter(Boolean).slice(0, 6);
  return words.join(" ").replace(/[\s,;:–—-]+$/u, "").trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/magic/headline.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/headline.ts apps/marketing/lib/magic/headline.test.ts
git commit -m "feat(magic): deriveHeadline fallback helper for post graphics"
```

---

### Task 2: `platformTheme` config

**Files:**
- Create: `apps/marketing/lib/magic/post-graphic-style.ts`
- Test: `apps/marketing/lib/magic/post-graphic-style.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/marketing/lib/magic/post-graphic-style.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { platformTheme } from "./post-graphic-style";

describe("platformTheme", () => {
  it("gives Instagram a vibrant gradient square", () => {
    const t = platformTheme("Instagram");
    expect(t.treatment).toBe("gradient");
    expect(t.aspect).toBe(1);
    expect(t.emoji).toBe(true);
  });

  it("gives LinkedIn a restrained dark treatment with a subhead and no emoji", () => {
    const t = platformTheme("LinkedIn");
    expect(t.treatment).toBe("darkAccent");
    expect(t.subhead).toBe(true);
    expect(t.emoji).toBe(false);
  });

  it("maps both x and twitter to the solid landscape treatment", () => {
    expect(platformTheme("X").treatment).toBe("solid");
    expect(platformTheme("twitter").treatment).toBe("solid");
    expect(platformTheme("X").aspect).toBeCloseTo(1.78);
  });

  it("falls back to the gradient default for unknown platforms", () => {
    expect(platformTheme("TikTok").treatment).toBe("gradient");
    expect(platformTheme("").treatment).toBe("gradient");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/magic/post-graphic-style.test.ts`
Expected: FAIL — "platformTheme is not a function".

- [ ] **Step 3: Write minimal implementation**

Create `apps/marketing/lib/magic/post-graphic-style.ts`:

```ts
export type Treatment = "gradient" | "darkAccent" | "solid";

export interface PlatformTheme {
  /** width / height of the graphic. */
  aspect: number;
  treatment: Treatment;
  headlineScale: "lg" | "md" | "sm";
  emoji: boolean;
  hashtag: boolean;
  subhead: boolean;
}

const THEMES: Record<string, PlatformTheme> = {
  instagram: { aspect: 1, treatment: "gradient", headlineScale: "lg", emoji: true, hashtag: true, subhead: false },
  facebook: { aspect: 1, treatment: "gradient", headlineScale: "lg", emoji: true, hashtag: true, subhead: false },
  linkedin: { aspect: 1.91, treatment: "darkAccent", headlineScale: "md", emoji: false, hashtag: false, subhead: true },
  x: { aspect: 1.78, treatment: "solid", headlineScale: "lg", emoji: false, hashtag: true, subhead: false },
  twitter: { aspect: 1.78, treatment: "solid", headlineScale: "lg", emoji: false, hashtag: true, subhead: false },
};

const DEFAULT_THEME: PlatformTheme = THEMES.instagram;

/** Platform-dependent render config; case-insensitive, safe default for unknowns. */
export function platformTheme(platform: string): PlatformTheme {
  return THEMES[platform.trim().toLowerCase()] ?? DEFAULT_THEME;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/magic/post-graphic-style.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/post-graphic-style.ts apps/marketing/lib/magic/post-graphic-style.test.ts
git commit -m "feat(magic): platformTheme config for per-platform post graphics"
```

---

### Task 3: `headline` generation field + version bump

**Files:**
- Modify: `apps/marketing/lib/magic/types.ts`
- Modify: `apps/marketing/lib/magic/generate.ts`
- Modify: `apps/marketing/lib/magic/generate.test.ts`
- Modify: `apps/marketing/lib/magic/result-version.ts`
- Modify: `apps/marketing/lib/magic/result-version.test.ts`

- [ ] **Step 1: Add the `headline` field to the type**

In `apps/marketing/lib/magic/types.ts`, inside `interface MagicSamplePost`, add after `caption`:

```ts
  /** Short punchy line (3-6 words) rendered big on the post graphic. */
  headline?: string;
```

- [ ] **Step 2: Write the failing tests**

In `apps/marketing/lib/magic/generate.test.ts`:

(a) Add `headline` to the sample post inside `VALID_JSON.samplePosts[0]` (after `caption`):

```ts
    { platform: "Instagram", caption: "Reclaim your weekends.", headline: "Reclaim your weekends", hashtags: ["#worklife"], engagement: { likes: 200, comments: 12, shares: 5 }, imagePrompt: "a calm tidy desk at golden hour" },
```

(b) Add two tests inside the `describe("generateMagicResult", ...)` block:

```ts
  it("carries the per-post headline through", async () => {
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(VALID_JSON));
    expect(result.samplePosts[0].headline).toBe("Reclaim your weekends");
  });

  it("derives a headline from the caption when the model omits one", async () => {
    const bad = JSON.parse(VALID_JSON);
    delete bad.samplePosts[0].headline;
    bad.samplePosts[0].caption = "Work less, live more: the calm way to grow.";
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(JSON.stringify(bad)));
    expect(result.samplePosts[0].headline).toBe("Work less, live more");
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run lib/magic/generate.test.ts`
Expected: FAIL — `headline` is `undefined` (normaliseResult drops it).

- [ ] **Step 4: Implement — prompt + normalise**

In `apps/marketing/lib/magic/generate.ts`:

(a) Add the import at the top (after the existing imports):

```ts
import { deriveHeadline } from "./headline";
```

(b) Replace instruction line 4 in `buildMagicPrompt` with:

```ts
4. Write 3 sample social posts in the brand's tone. For each: platform, caption, a short "headline" of 3-6 punchy words suited to that platform (this is the BIG text on the post graphic — bold and benefit-led, NOT a copy of the caption), 2-3 hashtags, and realistic engagement numbers (likes/comments/shares).
```

(c) In the JSON shape, change the `samplePosts` example object to include `headline` (after `caption`):

```ts
  "samplePosts": [ { "platform": "", "caption": "", "headline": "", "hashtags": ["#tag"], "engagement": { "likes": 0, "comments": 0, "shares": 0 }, "imagePrompt": "" } ]
```

(d) In `normaliseResult`, inside the `samplePosts.map(...)` object, add after `caption: p.caption,`:

```ts
          headline:
            typeof p.headline === "string" && p.headline.trim()
              ? p.headline.trim()
              : deriveHeadline(p.caption),
```

- [ ] **Step 5: Bump the result version**

In `apps/marketing/lib/magic/result-version.ts`, change:

```ts
export const RESULT_VERSION = 3;
```

In `apps/marketing/lib/magic/result-version.test.ts`, add a test inside the `describe` block:

```ts
  it("is at version 3 (headline added to sample posts)", () => {
    expect(RESULT_VERSION).toBe(3);
  });
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run lib/magic/generate.test.ts lib/magic/result-version.test.ts`
Expected: PASS (generate: 8 tests; result-version: 4 tests).

- [ ] **Step 7: Commit**

```bash
git add apps/marketing/lib/magic/types.ts apps/marketing/lib/magic/generate.ts apps/marketing/lib/magic/generate.test.ts apps/marketing/lib/magic/result-version.ts apps/marketing/lib/magic/result-version.test.ts
git commit -m "feat(magic): generate a per-post headline; bump result version to 3"
```

---

### Task 4: `PostGraphic` component

**Files:**
- Create: `apps/marketing/components/magic/post-graphic.tsx`

> Presentational only. No unit test (this app has no jsdom/RTL setup); verified by eyeball in Task 6. Logic it depends on (`platformTheme`, `deriveHeadline`) is already tested.

- [ ] **Step 1: Write the component**

Create `apps/marketing/components/magic/post-graphic.tsx`:

```tsx
"use client";

import type { MagicBrand, MagicSamplePost } from "@/lib/magic/types";
import { platformTheme, type PlatformTheme } from "@/lib/magic/post-graphic-style";
import { deriveHeadline } from "@/lib/magic/headline";

const SCALE: Record<PlatformTheme["headlineScale"], string> = {
  lg: "text-3xl",
  md: "text-2xl",
  sm: "text-xl",
};

/**
 * Code-rendered, on-brand social post graphic ("bold statement" direction).
 * Deterministic and instant — replaces the old AI image. Look varies per platform.
 */
export function PostGraphic({ brand, post }: { brand: MagicBrand; post: MagicSamplePost }) {
  const theme = platformTheme(post.platform);
  const headline = post.headline?.trim() || deriveHeadline(post.caption) || brand.tagline || brand.name;
  const accent = brand.palette[0] ?? "#6366f1";
  const accent2 = brand.palette[1] ?? accent;
  const onColor = theme.treatment !== "darkAccent";

  const logo = (
    <span className="inline-flex items-center gap-2 font-semibold">
      {brand.logoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={brand.logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: onColor ? "rgba(255,255,255,0.2)" : accent }}
        >
          {brand.name.slice(0, 1)}
        </span>
      )}
      {brand.name}
    </span>
  );

  if (theme.treatment === "darkAccent") {
    return (
      <div
        className="flex w-full flex-col justify-between bg-[#13151a] p-5"
        style={{ aspectRatio: String(theme.aspect) }}
      >
        <span className="h-[3px] w-10 rounded-full" style={{ background: accent }} />
        <div>
          <p className={`font-bold leading-tight tracking-tight text-zinc-100 ${SCALE[theme.headlineScale]}`}>{headline}</p>
          {theme.subhead && brand.tagline ? (
            <p className="mt-1 text-sm font-medium" style={{ color: accent2 }}>{brand.tagline}</p>
          ) : null}
        </div>
        <span className="text-xs text-zinc-400">{logo}</span>
      </div>
    );
  }

  const background = theme.treatment === "solid" ? accent : `linear-gradient(140deg, ${accent}, ${accent2})`;
  const footer = `${theme.hashtag && post.hashtags[0] ? post.hashtags[0] : ""}${theme.emoji ? " ✨" : ""}`.trim();

  return (
    <div
      className="flex w-full flex-col justify-between p-5 text-white"
      style={{ background, aspectRatio: String(theme.aspect) }}
    >
      <span className="text-xs">{logo}</span>
      <p className={`font-extrabold leading-[1.1] tracking-tight ${SCALE[theme.headlineScale]}`}>{headline}</p>
      <span className="text-xs font-semibold text-white/85">{footer}</span>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: exit 0 (no errors). The component is not yet referenced anywhere — that's fine.

- [ ] **Step 3: Commit**

```bash
git add apps/marketing/components/magic/post-graphic.tsx
git commit -m "feat(magic): PostGraphic — code-rendered platform-aware post visual"
```

---

### Task 5: Wire `PostGraphic` in; remove the AI image fetch

**Files:**
- Modify: `apps/marketing/components/magic/branded-post.tsx`
- Modify: `apps/marketing/components/magic/branded-post-carousel.tsx`
- Modify: `apps/marketing/components/magic/reveal.tsx`
- Modify: `apps/marketing/components/magic/start-flow.tsx`
- Modify: `apps/marketing/components/magic/use-post-images.ts`

- [ ] **Step 1: Render `PostGraphic` in `BrandedPost`**

In `apps/marketing/components/magic/branded-post.tsx`:

(a) Add the import after the existing `import type` line:

```tsx
import { PostGraphic } from "./post-graphic";
```

(b) Change the props — remove `imageUrl` and `loading`:

```tsx
export function BrandedPost({
  post,
  brand,
}: {
  post: MagicSamplePost;
  brand: MagicBrand;
}) {
```

(c) Replace the entire image `<div className="relative h-44 ...">…</div>` block (the gradient/image/loading area, including the watermark span) with:

```tsx
      <div className="w-full overflow-hidden">
        <PostGraphic post={post} brand={brand} />
      </div>
```

After this edit, `accent` is still used (logo monogram fallback + hashtag colour) so keep it; `accent2` is now unused, so **delete the `const accent2 = ...` line** to keep lint clean.

- [ ] **Step 2: Drop `usePostImages` and `id` from the carousel**

In `apps/marketing/components/magic/branded-post-carousel.tsx`:

(a) Remove the import line `import { usePostImages } from "./use-post-images";`.

(b) Change the signature to drop `id`:

```tsx
export function BrandedPostCarousel({
  posts,
  brand,
}: {
  posts: MagicSamplePost[];
  brand: MagicBrand;
}) {
  const [i, setI] = useState(0);
  if (!posts.length) return null;
```

(c) Remove the `const images = usePostImages(id, posts);` line.

(d) Change the `<BrandedPost ... />` call to drop image props:

```tsx
        <BrandedPost post={posts[i]} brand={brand} />
```

- [ ] **Step 3: Drop `id` from `Reveal`**

In `apps/marketing/components/magic/reveal.tsx`:

(a) Change the signature: `export function Reveal({ result }: { result: MagicResult }) {`

(b) Change the carousel call: `<BrandedPostCarousel posts={result.samplePosts} brand={result.brand} />`

- [ ] **Step 4: Update the `Reveal` call site**

In `apps/marketing/components/magic/start-flow.tsx`, line ~150, change:

```tsx
      {result && id && <Reveal result={result} />}
```

(`id` is still used elsewhere in start-flow for the signup link — leave the rest untouched.)

- [ ] **Step 5: Mark the dormant hook**

In `apps/marketing/components/magic/use-post-images.ts`, add at the very top of the file (above `"use client";`):

```tsx
// DORMANT: the post flow now renders code-built graphics (PostGraphic) and no
// longer calls this hook. Kept in case AI imagery is reintroduced elsewhere.
```

- [ ] **Step 6: Typecheck + lint the touched files**

Run: `npx tsc --noEmit`
Expected: exit 0.

Run: `npx next lint --file components/magic/branded-post.tsx --file components/magic/branded-post-carousel.tsx --file components/magic/reveal.tsx --file components/magic/start-flow.tsx --file components/magic/post-graphic.tsx`
Expected: "No ESLint warnings or errors".

- [ ] **Step 7: Commit**

```bash
git add apps/marketing/components/magic/branded-post.tsx apps/marketing/components/magic/branded-post-carousel.tsx apps/marketing/components/magic/reveal.tsx apps/marketing/components/magic/start-flow.tsx apps/marketing/components/magic/use-post-images.ts
git commit -m "feat(magic): render code-built post graphics; drop AI image fetch from reveal"
```

---

### Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole test suite**

Run: `npx vitest run`
Expected: all files pass (the prior 76 + new headline (4) and post-graphic-style (4) tests, plus the 2 generate + 1 result-version additions).

- [ ] **Step 2: Typecheck the whole app**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Lint the whole app**

Run: `npx next lint`
Expected: no errors.

- [ ] **Step 4: Eyeball in the running app**

Run: `pnpm --filter @repo/marketing dev`, take a real URL through the flow to the reveal. Confirm for each sample post:
- The graphic renders **instantly** (no gradient → pop-in).
- Instagram/Facebook = vibrant gradient square; LinkedIn = dark, restrained, tagline subhead; X = solid colour landscape.
- The real logo (or monogram) and a readable headline show; text is crisp.

- [ ] **Step 5: Final commit (if any eyeball tweaks were needed)**

```bash
git add -A
git commit -m "fix(magic): post-graphic polish after eyeball"
```

---

## Notes for the implementer

- All commands run from `apps/marketing/`. The test runner is Vitest (`npx vitest run <path>`).
- `RESULT_VERSION` 3 means any cached pre-headline rows are ignored and regenerated on next analyse — expected and desired.
- Do **not** delete the AI image files (`visuals/route.ts`, `images.ts`, `image-style.ts`, `use-post-images.ts`) or the Supabase bucket — they are intentionally dormant.
