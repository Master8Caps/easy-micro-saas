# Images on Social Posts — Design

**Date:** 2026-06-16
**Branch:** `feat/social-post-images`
**Status:** Approved (design), pending implementation plan

## Problem

Social posts can't carry their own image in a way that matches how the platforms work. Today:
- Image generation is coupled to a single content type, **`image-prompt`** — the in-app `ImageGenerator` only renders when `piece.type === "image-prompt"` (`apps/app/app/(dashboard)/content/content-list.tsx:522`, `apps/app/app/(dashboard)/campaigns/campaign-panel.tsx:350`).
- Instagram content collapses into `image-prompt`: brain generation tells the LLM "for Instagram, always use image-prompt or video-script" (`apps/app/server/actions/brain.ts:426`), and `mapContentType` maps an Instagram text-post to `image-prompt` (`apps/app/server/actions/content.ts:14-33`). The actual image is never auto-generated; the user must click "Generate Image".
- Facebook / X / LinkedIn map to pure-text types (`facebook-post`, `twitter-post`, `linkedin-post`) with **no path to an image at all**.
- There is no `instagram-post` content type. Metricool's Instagram mapping points at a non-existent type `instagram-reel-caption` (`apps/app/lib/metricool/types.ts:60-67`), so IG publishing is broken.

**Goal:** Decouple "has an image" from the content type. Let Facebook / X / LinkedIn posts *optionally* carry an image, and make Instagram a first-class type that *always* has one.

## Decisions (validated)

1. **Image as an optional attachment.** A post keeps its native type (`facebook-post`, `linkedin-post`, `twitter-post`); the image + image prompt live on the post regardless of type. **Instagram becomes its own `instagram-post` type that always carries an image.**
2. **Hybrid generation timing.** Instagram images are **auto-generated at content-generation time** (best-effort); Facebook / X / LinkedIn write only the image *prompt* at generation time and the image is generated **on demand**.
3. **The LLM decides which FB/X/LinkedIn posts get an image** during generation (when a visual genuinely adds value) and writes the prompt for those. **Instagram always.** The user can add or remove an image on any post at any time (override).
4. **No new DB column.** Reuse `image_url`, `image_source`, `image_prompt_used`. A post that *wants* an image but doesn't have one yet = `image_prompt_used` set **and** `image_url` null ("pending").
5. **Generate from the review card** too — a pending post shows a "Generate image" button in the swipe review hub, not only on the content page.

## Components & changes

### 1. Data model — add the `instagram-post` type

- New migration adding `'instagram-post'` to the `content_pieces.type` CHECK constraint (extends the list from `supabase/migrations/00008_expand_content_types.sql:9-16`). Additive; no data backfill.
- No new columns. "Pending image" is derived: `image_prompt_used != null && image_url == null`. `image_source` stays `null` until generated/uploaded (existing semantics).

### 2. Generation

**Brain (`apps/app/server/actions/brain.ts`)**
- Change the Instagram guidance (currently line 426 + `allowedTypes` at lines 384-390) so Instagram *social* campaigns produce a social text-post (which `mapContentType` will resolve to `instagram-post`), keeping `video-script` for video. The brain still drives `channel` + `content_type` per campaign.

**Content generation (`apps/app/server/actions/content.ts`)**
- `mapContentType` (lines 14-33): Instagram + `text-post` → **`instagram-post`** (instead of `image-prompt`). Other mappings unchanged.
- The per-piece social LLM output schema (`buildContentPrompt`, lines 107-171; output currently `{title, body, cta_text, notes}`) gains an optional **`image_prompt`** string. Prompt instructions:
  - **Instagram** → ALWAYS produce `image_prompt`.
  - **Facebook / X / LinkedIn** → produce `image_prompt` ONLY when a visual genuinely strengthens the post; otherwise omit it (post stays text).
- Insert (lines 387-401): set `image_prompt_used = piece.image_prompt ?? null`. (Image columns are otherwise still unset here.)
- **Instagram auto-gen:** after inserting `instagram-post` rows that have an `image_prompt`, call the existing image path best-effort (try/catch per piece). On failure, leave the row pending (prompt set, `image_url` null) — never block or fail the overall content generation. Implementation may extract the core of `generateImage` (`apps/app/server/actions/images.ts:48-143`) into a reusable internal helper that takes an explicit prompt + channel and returns the stored URL, so both the on-demand action and the auto-gen path share one code path. The current `generateImage` server action stays as the user-triggered entry point.

### 3. Image generation availability

- Un-gate the `ImageGenerator`: render it for any social post, not only `image-prompt` (`content-list.tsx:522`, `campaign-panel.tsx:350`). Change the condition from `piece.type === "image-prompt"` to "is a social post type" (the same set as the review deck — see §4).
- `generateImage` itself needs no change: it already derives size per channel via `CHANNEL_ASPECT_RATIOS` (`images.ts:11-19`, Instagram = `1024x1024`) and uploads to the `content-images` bucket.

### 4. Review deck (`apps/app/server/actions/review.ts` + `apps/app/components/review/post-card.tsx`)

- Add `instagram-post` to `SOCIAL_REVIEW_TYPES`.
- `PostCard` visual logic becomes: show the **image** when `image_url` present; show a **placeholder** when pending (`image_prompt_used` set, no `image_url`) or for `instagram-post`; text-forward otherwise. `ReviewCard` gains the fields needed to know "pending" (`imagePromptUsed`/`hasImage` or a derived `imageState`).
- A **"Generate image"** button on pending review cards triggers the existing `generateImage` action and swaps the placeholder for the result (optimistic). The button stops pointer propagation so it doesn't start a swipe (same pattern as the "Show more" toggle).

### 5. Labels & Metricool

- `apps/app/components/pills.tsx`: add `"instagram-post": "Instagram Post"` to `typeLabels`; the Instagram channel icon already exists in `channelIcons`.
- `apps/app/lib/metricool/types.ts` (lines 60-67): map `"instagram-post" → "INSTAGRAM"` and remove the dead `"instagram-reel-caption"` key.

### 6. Cost

- Only Instagram spends image credits at content-generation time; FB/X/LinkedIn are on-demand. This matches the planned tier-based regeneration limiter (a separate initiative — not built here).

## Data flow

Brain → campaigns (`channel`, `content_type`) → content generation: LLM writes `body` + optional `image_prompt`; `mapContentType` resolves `type` (Instagram → `instagram-post`); rows inserted with `image_prompt_used` set for image-wanting posts → Instagram rows auto-generate their image best-effort → review/content display image, pending placeholder, or text; user can generate (pending) or add/remove an image on any post.

## Testing

- **Unit:** `mapContentType` Instagram→`instagram-post` and unchanged others; a pure "image state" helper (`none` / `pending` / `ready`) from (`image_prompt_used`, `image_url`); `SOCIAL_REVIEW_TYPES` includes `instagram-post`.
- **Existing:** swipe-gesture + review tests stay green.
- **Manual:** generate an Instagram campaign → posts arrive *with* images (or pending if gen failed); generate a Facebook campaign → some posts flagged pending, rest text; click "Generate image" on a pending review card → image appears; add then remove an image on a text post; confirm `/content` shows the generator for non-`image-prompt` social posts.

## Out of scope

- Tier-based image-regeneration limits (separate initiative).
- Video thumbnails / multi-image carousels.
- Backfilling images onto existing pieces.
- Reworking the marketing-side magic flow.
