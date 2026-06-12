# Branded Post Graphics — design

**Date:** 2026-06-12
**Branch:** `feat/branded-post-graphics`
**Status:** Approved (brainstorm), pending implementation plan

## Problem

The reveal's sample posts use AI-generated imagery (`gpt-image-1`). In practice that approach is wrong for these posts:

- **Bad quality** — generic, "AI slop", barely related to the brand, can't render text or place the real logo.
- **Late** — images generate *after* the user already sees the posts (gradient → pop-in), so the reveal feels unfinished.
- **Costly / fragile** — per-post OpenAI calls, latency, rate limits, an email gate, and a Supabase upload all on the critical path.

What we actually want: **designed, text-forward social graphics** — mostly a short headline, the brand colours, and the real logo — that look intentionally art-directed and vary by platform.

## Decision summary

| Decision | Choice |
|---|---|
| Production method | **Code-rendered (HTML/CSS), no AI.** Deterministic, instant, free, exactly on-brand. |
| Visual direction | **"Bold statement"** — brand colour + big headline + logo chip. |
| Platform behaviour | **Platform-dependent** treatment (see below). |
| Headline text | **New `headline` field from AI generation**, with a code-derived fallback. |
| Existing AI machinery | **Left dormant** — not removed. The posts simply stop calling it. |

## Architecture

Three small, independently-testable units plus edits to the post card.

### 1. `lib/magic/post-graphic-style.ts` (new, pure, tested)

Maps a platform name to its render config. This is the "platform-dependent" brain, kept out of the component.

```ts
export type Treatment = "gradient" | "darkAccent" | "solid";
export interface PlatformTheme {
  aspect: number;        // width / height
  treatment: Treatment;
  headlineScale: "lg" | "md" | "sm";
  emoji: boolean;        // allow emoji in the headline/footer
  hashtag: boolean;      // show a hashtag on the graphic
  subhead: boolean;      // show a secondary line (LinkedIn)
}
export function platformTheme(platform: string): PlatformTheme;
```

| Platform | aspect | treatment | scale | emoji | subhead | feel |
|---|---|---|---|---|---|---|
| instagram | 1.0 (1:1) | gradient | lg | yes | no | vibrant, expressive |
| facebook | 1.0 | gradient | lg | yes | no | mirrors Instagram |
| linkedin | 1.91 | darkAccent | md | no | yes | restrained, credible |
| x / twitter | 1.78 (16:9) | solid | lg (short) | no | no | punchy, minimal |
| *unknown* | 1.0 | gradient | lg | yes | no | safe default |

Matching is case-insensitive; `x` and `twitter` both map to the X theme.

### 2. `lib/magic/headline.ts` (new, pure, tested)

`deriveHeadline(caption: string): string` — fallback when a post has no AI `headline`. Takes the first sentence/clause, strips trailing punctuation and emoji, caps at ~6 words. Guarantees the graphic always has a sensible line even on legacy/edge data.

### 3. `components/magic/post-graphic.tsx` (new, presentational)

```ts
function PostGraphic({ brand, post }: { brand: MagicBrand; post: MagicSamplePost })
```

- Reads `platformTheme(post.platform)`.
- Headline = `post.headline ?? deriveHeadline(post.caption)`.
- Renders the "Bold statement" layout for the theme's treatment:
  - **gradient**: full-bleed `linear-gradient` of `brand.palette`, white headline, logo chip, optional hashtag/emoji.
  - **darkAccent**: dark background, thin brand-colour accent rule, headline + brand-colour subhead, muted logo chip. Subhead text = `brand.tagline` (omitted if empty).
  - **solid**: solid `brand.palette[0]`, very short white headline, logo chip + hashtag row.
- Logo chip uses `brand.logoUrl` when present, else a monogram of `brand.name[0]` on a brand-colour disc (the existing fallback pattern).
- Container uses the theme's `aspect` (one slide shows at a time, so the carousel adapts; nav controls sit in a stable container below).

### 4. Edits to existing files

- **`components/magic/branded-post.tsx`** — replace the image area (`imageUrl ? <img> : loading ? pulse : gradient`) with `<PostGraphic brand={brand} post={post} />`. Drop the `imageUrl` / `loading` props.
- **`components/magic/branded-post-carousel.tsx`** — stop calling `usePostImages`; drop the `images` wiring. The graphic is synchronous, so there is no loading state. (This removes the post-reveal pop-in.)
- **`lib/magic/types.ts`** — add `headline?: string` to `MagicSamplePost`.
- **`lib/magic/generate.ts`** — `buildMagicPrompt` asks for a per-post `headline` (3–6 punchy words, suited to the post's platform) and adds it to the JSON shape; `normaliseResult` carries `headline` through with the `deriveHeadline(caption)` fallback.
- **`lib/magic/result-version.ts`** — bump `RESULT_VERSION` 2 → 3 so cached pre-headline rows regenerate.

## Data flow

```
analyze → generateMagicResult → result.samplePosts[i].headline (+ caption, hashtags, platform)
reveal → BrandedPostCarousel → BrandedPost → PostGraphic(brand, post)
                                                 └─ platformTheme(platform) + headline → designed graphic (instant)
```

No network calls, no email gate, no OpenAI, no Supabase upload in this path.

## Dormant code (intentionally left in place)

`app/api/magic/visuals/route.ts`, `components/magic/use-post-images.ts`, `lib/magic/images.ts`, `lib/magic/image-style.ts`, the `magic-images` bucket, and `OPENAI_API_KEY` remain but are no longer referenced by the post flow. Kept in case AI visuals are wanted elsewhere later (hero, ads). A short note is added near `usePostImages` marking it dormant.

## Error / edge handling

- Missing `headline` → `deriveHeadline(caption)`. Missing caption too → brand tagline → brand name.
- Missing `logoUrl` → monogram fallback.
- Empty / 1-colour palette → solid uses `palette[0]`; gradient duplicates the single colour.
- Unknown platform → default theme.

## Testing

- `post-graphic-style.test.ts` — each known platform maps to its theme; unknown → default; `x`/`twitter` case-insensitive.
- `headline.test.ts` — clause extraction, word cap, punctuation/emoji stripping, empty input.
- `generate.test.ts` (extend) — `normaliseResult` carries `headline`; falls back to derived headline when absent.
- `result-version.test.ts` — reflects the new version constant.
- `PostGraphic` is presentational (no jsdom/RTL set up in this app) → verified by manual eyeball in the reveal, consistent with the repo's existing test style.

## Out of scope

- Re-introducing AI imagery anywhere.
- Per-platform aspect ratio beyond the table above.
- Changing the swipe/journey flow.
