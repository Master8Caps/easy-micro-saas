# Image Generation Integration — Design Spec

_Date: 2026-03-13_

---

## Overview

Add AI image generation to the marketing platform, replacing the current manual workflow where users copy text prompts into external tools. Users will be able to generate images on-demand from existing `image-prompt` content pieces, edit prompts before regenerating, and upload their own images as alternatives.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Image provider | GPT Image 1 (OpenAI) | ~95% text accuracy, simple API, already in stack (planned for embeddings), pay-as-you-go, no enterprise minimums |
| Storage | Supabase Storage | Keeps stack unified, already wired up everywhere, sufficient for current stage |
| Generation trigger | On-demand button | Controls API costs, lets users tweak prompts before generating |
| Editing model | Generate + edit prompt + regenerate + manual upload | Maximum flexibility; manual upload addresses Crush's weakness of distorting product images |
| Aspect ratio | Auto-select by channel with user override | Smart defaults reduce friction; override handles edge cases |
| Quality | Default medium, HD toggle for high | Medium ($0.07) is good for social; HD ($0.19) available when it matters |
| Architecture | Server action | Matches existing codebase pattern (same as content/brain generation) |

### Future Consideration

Image regenerations will need rate limiting by subscription tier to control costs. Not implementing now, but the architecture should make it easy to add (e.g., track generation count per user). See memory: `project_image_gen_rate_limits.md`.

---

## Database Changes

### Migration 00019: Image Generation Support

**Add columns to `content_pieces`:**

```sql
ALTER TABLE content_pieces
  ADD COLUMN image_url text,
  ADD COLUMN image_source text,
  ADD COLUMN image_prompt_used text;

-- Constrain image_source to known values
ALTER TABLE content_pieces
  ADD CONSTRAINT content_pieces_image_source_check
  CHECK (image_source IN ('generated', 'uploaded'));
```

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `image_url` | text | yes | Public URL of image in Supabase Storage |
| `image_source` | text | yes | `'generated'` (AI) or `'uploaded'` (user file) — constrained |
| `image_prompt_used` | text | yes | Exact prompt sent to GPT Image 1 (editable by user) |

### Supabase Storage

- **Bucket:** `content-images` (public access — images served directly via URL)
- **Path convention:** `{product_id}/{content_piece_id}.{ext}` — preserve original extension for uploads (png/jpg/webp), use `.png` for generated images
- **Overwrite strategy:** Regeneration or upload replaces the file at the same path (no orphaned files). Append `?v={timestamp}` to stored `image_url` for cache busting on regeneration/replacement.
- **Storage policies:** Upload/delete operations are performed via the service-role Supabase client in server actions (same pattern as click logging), which bypasses storage RLS. Auth and ownership are verified in the server action before calling storage. Public read access for serving.

**Note:** Using the service-role client for storage writes is consistent with the existing pattern in the codebase where operations that need cross-table ownership verification use the service client. The server action verifies ownership by fetching the content piece through the user's RLS-scoped client before performing storage operations.

---

## OpenAI Integration

### Client Setup

Instantiate the OpenAI client at the top of `images.ts`, matching the existing pattern where Anthropic is instantiated directly in `content.ts` and `brain.ts`:

```typescript
import OpenAI from "openai";
const openai = new OpenAI(); // reads OPENAI_API_KEY from env automatically
```

**Environment variable:** `OPENAI_API_KEY` added to `.env.local` and `turbo.json` env array.
**Package:** `openai` npm package (^4.x).

### Image Generation Call

Uses the OpenAI Images API with `gpt-image-1` model:

```typescript
const response = await openai.images.generate({
  model: "gpt-image-1",
  prompt: imagePrompt,
  n: 1,
  size: size,       // "1024x1024" | "1024x1536" | "1536x1024"
  quality: quality,  // "medium" | "high"
});
```

Response returns base64-encoded image data. This is then uploaded to Supabase Storage as a PNG.

---

## Server Actions

All server actions in `apps/app/server/actions/images.ts` (with `"use server"` directive).

**Auth pattern:** Server actions fetch the content piece via the user-scoped Supabase client (which enforces RLS). If the query returns no row, the user doesn't own it — reject. Storage writes then use the service-role client. This matches the existing pattern in the codebase.

**Timeout:** Export `maxDuration = 60` for this file since image generation can take 10-30s.

### `generateImage(contentPieceId: string, options?: { size?: string, quality?: string })`

1. Auth check — fetch content piece via user-scoped client (RLS enforces ownership)
2. Fetch content piece from DB
3. Determine prompt: use `image_prompt_used` if set, otherwise extract from `body`
4. Determine size: use `options.size` if provided, otherwise auto-select from channel metadata
5. Determine quality: use `options.quality` if provided, otherwise `"medium"`
6. Call GPT Image 1 API
7. Decode base64 response → upload to Supabase Storage at `{product_id}/{content_piece_id}.png` via service-role client
8. Get public URL, append `?v={Date.now()}` for cache busting
9. Update content piece: set `image_url`, `image_source = 'generated'`, `image_prompt_used` (if first generation)
10. `revalidatePath` to refresh UI

### `uploadContentImage(contentPieceId: string, formData: FormData)`

1. Auth check — fetch content piece via user-scoped client (RLS enforces ownership)
2. Extract file from FormData, validate type (PNG, JPG, WebP) and size (max 5MB)
3. Upload to Supabase Storage at `{product_id}/{content_piece_id}.{ext}` via service-role client (preserve original extension)
4. Get public URL, append `?v={Date.now()}` for cache busting
5. Update content piece: set `image_url`, `image_source = 'uploaded'`
6. `revalidatePath`

### `deleteContentImage(contentPieceId: string)`

1. Auth check
2. Delete file from Supabase Storage
3. Clear `image_url`, `image_source`, `image_prompt_used` on content piece
4. `revalidatePath`

### `updateImagePrompt(contentPieceId: string, prompt: string)`

1. Auth check
2. Update `image_prompt_used` on content piece
3. `revalidatePath`

---

## Channel-to-Aspect-Ratio Mapping

Auto-select based on `metadata.channel`:

```typescript
const CHANNEL_ASPECT_RATIOS: Record<string, string> = {
  "linkedin":       "1536x1024",  // landscape
  "twitter":        "1536x1024",  // landscape
  "facebook":       "1024x1024",  // square
  "instagram":      "1024x1024",  // square
  "pinterest":      "1024x1536",  // portrait
  "tiktok":         "1024x1536",  // portrait
  "youtube":        "1536x1024",  // landscape
};

const DEFAULT_SIZE = "1024x1024"; // square fallback
```

User can override before generating.

---

## UI Components

### `ImageGenerator` Component

Displayed on content cards/panels for `image-prompt` type pieces. States:

**No image yet:**
- Aspect ratio selector (dropdown, pre-filled by channel default)
- HD toggle (off by default)
- "Generate Image" button (indigo, primary action)
- "Upload Image" button (secondary/outline)
- Prompt preview (collapsible, shows what will be sent to GPT Image 1)
- "Edit Prompt" link → expands textarea to modify `image_prompt_used`

**Generating:**
- Loading spinner with "Generating image..." text
- Disabled controls

**Image exists (generated):**
- Image preview (rendered as `<img>` with the Supabase Storage URL)
- Below image: aspect ratio + quality used, "Regenerate" button, "Delete" button
- "Edit Prompt" link to tweak and regenerate
- "Upload Instead" link to replace with own image

**Image exists (uploaded):**
- Image preview
- "Replace" button (upload new file)
- "Delete" button
- "Generate AI Image Instead" link

### Content Cards (content list, campaign panel)

- When `image_url` exists: show small thumbnail (64x64 or similar) on the content card alongside existing text preview
- Click thumbnail → opens larger preview in the expanded/slide-over view

### Image Display in Expanded Views

- Full-width image preview above the text body
- Download button (direct link to Supabase Storage URL)

---

## Prompt Extraction Logic

For first-time generation, the image prompt needs to be extracted from the `body` field which currently contains both the image prompt AND the caption text.

Current `image-prompt` body format (generated by Claude):
```
**Image Prompt:**
[detailed image generation prompt]

**Caption:**
[instagram/social caption text]
```

Extraction logic:
1. Look for "Image Prompt:" or "Image Generation Prompt:" header in body
2. Extract text between that header and the next header (e.g., "Caption:")
3. Save extracted prompt to `image_prompt_used`
4. If no clear header found, use the full `body` as the prompt (fallback)

---

## File Changes Summary

### New Files
- `apps/app/server/actions/images.ts` — image generation server actions (OpenAI client instantiated inline)
- `apps/app/components/image-generator.tsx` — main UI component
- `supabase/migrations/00019_image_generation.sql` — DB migration

### Modified Files
- `apps/app/server/actions/content.ts` — add `image_url`, `image_source`, `image_prompt_used` to `loadContentForCampaign()` select and `generateContentForCampaign()` insert select; clean up Supabase Storage files when content is regenerated (delete-then-insert flow)
- `apps/app/app/(dashboard)/content/content-list.tsx` — image thumbnails on cards
- `apps/app/app/(dashboard)/campaigns/campaign-panel.tsx` — image preview in panel
- `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx` — image thumbnail on schedule cards
- `apps/app/components/pills.tsx` — no changes needed (TypePill already shows "Image Post")
- `turbo.json` — add `OPENAI_API_KEY` to env array
- `apps/app/package.json` — add `openai` dependency

### Supabase Storage Setup (manual)
- Create `content-images` bucket in Supabase dashboard (public)
- Add storage policy: authenticated users can upload/delete in their product paths

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| OpenAI API fails | Show error toast, keep existing state, user can retry |
| OpenAI content policy rejection | Show specific message: "Image couldn't be generated due to content policy" |
| Upload too large (>5MB) | Client-side validation before upload, show size error |
| Invalid file type | Client-side validation, only accept PNG/JPG/WebP |
| Supabase Storage upload fails | Show error toast, don't update DB columns |
| Image generation timeout | Server action has built-in timeout handling, show retry option |

---

## What This Does NOT Include

- Batch image generation (generate images for all content at once) — keep it simple, one at a time
- Image editing/cropping in-app — out of scope, users can upload edited versions
- Rate limiting by tier — noted for future, not implemented now
- DALL-E 3 or Flux fallback — single provider for now
- Image generation for non-image-prompt types — only `image-prompt` content pieces get the ImageGenerator component
