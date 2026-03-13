# Image Generation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add on-demand AI image generation (GPT Image 1) to `image-prompt` content pieces, with Supabase Storage for persistence, manual upload support, and prompt editing.

**Architecture:** Server action calls OpenAI GPT Image 1 API, uploads the base64 result to a public Supabase Storage bucket, and saves the public URL to `content_pieces.image_url`. UI renders an `ImageGenerator` component on `image-prompt` type content with generate/upload/edit/delete controls.

**Tech Stack:** OpenAI SDK (gpt-image-1), Supabase Storage, Next.js 15 server actions, TypeScript, Tailwind CSS (dark/light mode via CSS variables)

**Spec:** `docs/superpowers/specs/2026-03-13-image-generation-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/00019_image_generation.sql` | Add `image_url`, `image_source`, `image_prompt_used` columns to `content_pieces` |
| `apps/app/server/actions/images.ts` | Server actions: `generateImage`, `uploadContentImage`, `deleteContentImage`, `updateImagePrompt` |
| `apps/app/components/image-generator.tsx` | Main UI component for image generation, upload, preview, prompt editing |

### Modified Files
| File | Changes |
|------|---------|
| `apps/app/package.json` | Add `openai` dependency |
| `turbo.json` | Add `OPENAI_API_KEY` to env array |
| `apps/app/server/actions/content.ts` | Add new columns to `loadContentForCampaign()` select and `generateContentForCampaign()` insert select; clean up Storage files on content regeneration |
| `apps/app/app/(dashboard)/content/content-list.tsx` | Add `image_url`/`image_source`/`image_prompt_used` to type interface; render `ImageGenerator` in expanded view and thumbnail on cards |
| `apps/app/app/(dashboard)/campaigns/campaign-panel.tsx` | Add image fields to type interface; render `ImageGenerator` in expanded content view |
| `apps/app/app/(dashboard)/content/page.tsx` | Add new columns to server query `.select()` |
| `apps/app/app/(dashboard)/schedule/page.tsx` | Add new columns to both server query `.select()` calls |
| `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx` | Add image fields to type interface; render image thumbnail in detail panel |

---

## Prerequisites (Manual Steps)

Before starting implementation, the user must:

1. **Create the `content-images` Storage bucket** in Supabase Dashboard → Storage → New bucket (Name: `content-images`, Public: Yes, Max size: 5MB, MIME types: `image/png, image/jpeg, image/webp`). No storage RLS policies are needed — all writes go through the service-role client in server actions, which bypasses RLS.
2. **Have an OpenAI API key** ready to add to `.env.local`.
3. **Apply migration 00019** after it's written (Task 1).

---

## Chunk 1: Database, Dependencies & Server Actions

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/00019_image_generation.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Add image generation columns to content_pieces
ALTER TABLE content_pieces
  ADD COLUMN image_url text,
  ADD COLUMN image_source text,
  ADD COLUMN image_prompt_used text;

-- Constrain image_source to known values
ALTER TABLE content_pieces
  ADD CONSTRAINT content_pieces_image_source_check
  CHECK (image_source IN ('generated', 'uploaded'));
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/00019_image_generation.sql
git commit -m "feat: add image generation columns to content_pieces (migration 00019)"
```

**Note for user:** Apply this migration to your Supabase database before testing. Run the SQL in the Supabase SQL Editor.

---

### Task 2: Install OpenAI SDK & Configure Environment

**Files:**
- Modify: `apps/app/package.json`
- Modify: `turbo.json`

- [ ] **Step 1: Install the OpenAI SDK**

Run from repo root:
```bash
cd apps/app && pnpm add openai
```

- [ ] **Step 2: Add `OPENAI_API_KEY` to `turbo.json` env array**

In `turbo.json`, add `"OPENAI_API_KEY"` to the build task env array (after `"ANTHROPIC_API_KEY"`):

```json
"env": [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "RESEND_API_KEY"
]
```

- [ ] **Step 3: Add `OPENAI_API_KEY` to `.env.local`**

Add to `apps/app/.env.local`:
```
OPENAI_API_KEY=sk-...
```

The user will need to provide their actual API key.

- [ ] **Step 4: Verify build still works**

Run: `pnpm build --filter=app`
Expected: Build succeeds (OpenAI SDK installed, env var declared)

- [ ] **Step 5: Commit**

```bash
git add apps/app/package.json pnpm-lock.yaml turbo.json
git commit -m "feat: install openai SDK and add OPENAI_API_KEY to turbo env"
```

---

### Task 3: Image Generation Server Actions

**Files:**
- Create: `apps/app/server/actions/images.ts`
- Reference: `apps/app/lib/supabase/server.ts` (user-scoped client)
- Reference: `apps/app/lib/supabase/service.ts` (service-role client, `createServiceClient()`)
- Reference: `apps/app/server/actions/content.ts` (pattern reference for auth + Supabase usage)

- [ ] **Step 1: Create the channel-to-aspect-ratio mapping and prompt extraction helper**

Create `apps/app/server/actions/images.ts`:

```typescript
"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

// Image generation can take 10-30s — extend Vercel timeout
export const maxDuration = 60;

const openai = new OpenAI();

// Channel → default aspect ratio mapping
const CHANNEL_ASPECT_RATIOS: Record<string, string> = {
  linkedin: "1536x1024",
  twitter: "1536x1024",
  facebook: "1024x1024",
  instagram: "1024x1024",
  pinterest: "1024x1536",
  tiktok: "1024x1536",
  youtube: "1536x1024",
};
const DEFAULT_SIZE = "1024x1024";

type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";
type ImageQuality = "medium" | "high";

function getDefaultSize(channel?: string): ImageSize {
  if (!channel) return DEFAULT_SIZE as ImageSize;
  return (CHANNEL_ASPECT_RATIOS[channel.toLowerCase()] || DEFAULT_SIZE) as ImageSize;
}

/**
 * Extract the image generation prompt from a content piece body.
 * The body typically has sections like "**Image Prompt:**" and "**Caption:**".
 * We want just the image prompt part.
 */
function extractImagePrompt(body: string): string {
  // Try to find "Image Prompt:" or "Image Generation Prompt:" header
  const promptMatch = body.match(
    /\*?\*?Image(?:\s+Generation)?\s+Prompt:?\*?\*?\s*\n?([\s\S]*?)(?:\n\*?\*?(?:Caption|Instagram|Social|Post|Text):?\*?\*?|\n---|\n\n\n|$)/i
  );
  if (promptMatch && promptMatch[1].trim().length > 20) {
    return promptMatch[1].trim();
  }
  // Fallback: use the full body
  return body;
}
```

- [ ] **Step 2: Add the `generateImage` server action**

Append to `apps/app/server/actions/images.ts`:

```typescript
export async function generateImage(
  contentPieceId: string,
  options?: { size?: ImageSize; quality?: ImageQuality }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch content piece via user-scoped client (RLS enforces ownership)
  const { data: piece, error } = await supabase
    .from("content_pieces")
    .select("id, body, image_prompt_used, product_id, metadata")
    .eq("id", contentPieceId)
    .single();

  if (error || !piece) throw new Error("Content piece not found");

  // Determine prompt
  const prompt = piece.image_prompt_used || extractImagePrompt(piece.body);
  if (!prompt || prompt.length < 10) throw new Error("No image prompt available");

  // Determine size from options or channel default
  const channel = (piece.metadata as Record<string, string>)?.channel;
  const size = options?.size || getDefaultSize(channel);
  const quality = options?.quality || "medium";

  // Call GPT Image 1
  let imageBase64: string;
  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: size as "1024x1024" | "1024x1536" | "1536x1024",
      quality,
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) throw new Error("No image data returned");
    imageBase64 = imageData;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    // Check for content policy violation
    if (message.includes("content_policy") || message.includes("safety")) {
      throw new Error("Image couldn't be generated due to content policy. Try adjusting the prompt.");
    }
    throw new Error(`Image generation failed: ${message}`);
  }

  // Upload to Supabase Storage via service client
  const serviceClient = createServiceClient();
  const storagePath = `${piece.product_id}/${contentPieceId}.png`;
  const buffer = Buffer.from(imageBase64, "base64");

  const { error: uploadError } = await serviceClient.storage
    .from("content-images")
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

  // Get public URL with cache-busting
  const { data: urlData } = serviceClient.storage
    .from("content-images")
    .getPublicUrl(storagePath);

  const imageUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // Update content piece
  const { error: updateError } = await supabase
    .from("content_pieces")
    .update({
      image_url: imageUrl,
      image_source: "generated",
      image_prompt_used: piece.image_prompt_used || prompt,
    })
    .eq("id", contentPieceId);

  if (updateError) throw new Error(`Failed to save image URL: ${updateError.message}`);

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");

  return { imageUrl };
}
```

- [ ] **Step 3: Add the `uploadContentImage` server action**

Append to `apps/app/server/actions/images.ts`:

```typescript
export async function uploadContentImage(
  contentPieceId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch content piece via user-scoped client (RLS enforces ownership)
  const { data: piece, error } = await supabase
    .from("content_pieces")
    .select("id, product_id")
    .eq("id", contentPieceId)
    .single();

  if (error || !piece) throw new Error("Content piece not found");

  const file = formData.get("image") as File | null;
  if (!file) throw new Error("No file provided");

  // Validate file type
  const validTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid file type. Please upload PNG, JPG, or WebP.");
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  // Determine extension from mime type
  const extMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  const ext = extMap[file.type] || "png";

  // Upload to Supabase Storage via service client
  const serviceClient = createServiceClient();
  const storagePath = `${piece.product_id}/${contentPieceId}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await serviceClient.storage
    .from("content-images")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

  // Get public URL with cache-busting
  const { data: urlData } = serviceClient.storage
    .from("content-images")
    .getPublicUrl(storagePath);

  const imageUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // Update content piece
  const { error: updateError } = await supabase
    .from("content_pieces")
    .update({
      image_url: imageUrl,
      image_source: "uploaded",
    })
    .eq("id", contentPieceId);

  if (updateError) throw new Error(`Failed to save image URL: ${updateError.message}`);

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");

  return { imageUrl };
}
```

- [ ] **Step 4: Add the `deleteContentImage` and `updateImagePrompt` server actions**

Append to `apps/app/server/actions/images.ts`:

```typescript
export async function deleteContentImage(contentPieceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch content piece via user-scoped client (RLS enforces ownership)
  const { data: piece, error } = await supabase
    .from("content_pieces")
    .select("id, product_id, image_url")
    .eq("id", contentPieceId)
    .single();

  if (error || !piece) throw new Error("Content piece not found");
  if (!piece.image_url) return; // Nothing to delete

  // Delete from Supabase Storage via service client
  const serviceClient = createServiceClient();

  // List files matching this content piece ID to find the exact file (could be .png, .jpg, .webp)
  const { data: files } = await serviceClient.storage
    .from("content-images")
    .list(piece.product_id, { search: contentPieceId });

  if (files && files.length > 0) {
    const paths = files.map((f) => `${piece.product_id}/${f.name}`);
    await serviceClient.storage.from("content-images").remove(paths);
  }

  // Clear image columns
  const { error: updateError } = await supabase
    .from("content_pieces")
    .update({
      image_url: null,
      image_source: null,
      image_prompt_used: null,
    })
    .eq("id", contentPieceId);

  if (updateError) throw new Error(`Failed to clear image data: ${updateError.message}`);

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");
}

export async function updateImagePrompt(
  contentPieceId: string,
  prompt: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("content_pieces")
    .update({ image_prompt_used: prompt })
    .eq("id", contentPieceId);

  if (error) throw new Error(`Failed to update prompt: ${error.message}`);

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");
}
```

- [ ] **Step 5: Verify the file compiles**

Run: `cd apps/app && npx tsc --noEmit`
Expected: No type errors in `images.ts`

- [ ] **Step 6: Commit**

```bash
git add apps/app/server/actions/images.ts
git commit -m "feat: add image generation, upload, delete, and prompt update server actions"
```

---

### Task 4: Update Content Queries for New Columns

**Files:**
- Modify: `apps/app/server/actions/content.ts`

- [ ] **Step 1: Add new columns to `loadContentForCampaign()` select**

In `apps/app/server/actions/content.ts`, find the `.select()` call in `loadContentForCampaign()` (around line 459):

```
"id, type, title, body, metadata, status, archived, posted_at, scheduled_for, created_at, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at, links(id, slug, click_count)"
```

Add `image_url, image_source, image_prompt_used` after `engagement_logged_at`:

```
"id, type, title, body, metadata, status, archived, posted_at, scheduled_for, created_at, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at, image_url, image_source, image_prompt_used, links(id, slug, click_count)"
```

- [ ] **Step 2: Add new columns to `generateContentForCampaign()` insert select**

In `generateContentForCampaign()`, find the `.select()` after the insert (around line 380):

```
"id, type, title, body, metadata, status, archived, created_at"
```

Add the new columns:

```
"id, type, title, body, metadata, status, archived, created_at, image_url, image_source, image_prompt_used"
```

- [ ] **Step 3: Add image cleanup on content regeneration**

In `generateContentForCampaign()`, find the delete block (around line 354-358) where old content is deleted before regenerating. Add image cleanup BEFORE the delete:

```typescript
// Clean up any stored images for old content pieces before deleting
const { data: oldPieces } = await supabase
  .from("content_pieces")
  .select("id, product_id, image_url")
  .eq("campaign_id", input.campaignId);

if (oldPieces && oldPieces.length > 0) {
  const piecesWithImages = oldPieces.filter((p) => p.image_url);
  if (piecesWithImages.length > 0) {
    const serviceClient = (await import("@/lib/supabase/service")).createServiceClient();
    const paths = piecesWithImages.map((p) => {
      // Extract filename from URL path (before query params)
      const urlPath = new URL(p.image_url!).pathname;
      const match = urlPath.match(/content-images\/(.+?)(\?|$)/);
      return match ? match[1] : `${p.product_id}/${p.id}.png`;
    });
    await serviceClient.storage.from("content-images").remove(paths);
  }
}
```

Place this block immediately before the existing delete query:
```typescript
await supabase
  .from("content_pieces")
  .delete()
  .eq("campaign_id", input.campaignId);
```

- [ ] **Step 4: Verify build**

Run: `cd apps/app && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add apps/app/server/actions/content.ts
git commit -m "feat: add image columns to content queries and clean up images on regeneration"
```

---

## Chunk 2: UI Components & Integration

### Task 5: ImageGenerator Component

**Files:**
- Create: `apps/app/components/image-generator.tsx`
- Reference: `apps/app/components/pills.tsx` (design patterns)
- Reference: `apps/app/server/actions/images.ts` (server actions to call)

- [ ] **Step 1: Create the ImageGenerator component**

Create `apps/app/components/image-generator.tsx`:

```typescript
"use client";

import { useState, useRef } from "react";
import {
  generateImage,
  uploadContentImage,
  deleteContentImage,
  updateImagePrompt,
} from "@/server/actions/images";

type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";
type ImageQuality = "medium" | "high";

const SIZE_LABELS: Record<ImageSize, string> = {
  "1024x1024": "Square (1024x1024)",
  "1024x1536": "Portrait (1024x1536)",
  "1536x1024": "Landscape (1536x1024)",
};

const CHANNEL_DEFAULTS: Record<string, ImageSize> = {
  linkedin: "1536x1024",
  twitter: "1536x1024",
  facebook: "1024x1024",
  instagram: "1024x1024",
  pinterest: "1024x1536",
  tiktok: "1024x1536",
  youtube: "1536x1024",
};

interface ImageGeneratorProps {
  contentPieceId: string;
  imageUrl: string | null;
  imageSource: "generated" | "uploaded" | null;
  imagePromptUsed: string | null;
  body: string;
  channel?: string;
}

export default function ImageGenerator({
  contentPieceId,
  imageUrl: initialImageUrl,
  imageSource: initialImageSource,
  imagePromptUsed: initialPromptUsed,
  body,
  channel,
}: ImageGeneratorProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [imageSource, setImageSource] = useState(initialImageSource);
  const [promptUsed, setPromptUsed] = useState(initialPromptUsed);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(initialPromptUsed || "");
  const [size, setSize] = useState<ImageSize>(
    channel ? CHANNEL_DEFAULTS[channel.toLowerCase()] || "1024x1024" : "1024x1024"
  );
  const [quality, setQuality] = useState<ImageQuality>("medium");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Save edited prompt first if user modified it
      if (showPromptEditor && editedPrompt !== promptUsed) {
        await updateImagePrompt(contentPieceId, editedPrompt);
        setPromptUsed(editedPrompt);
      }
      const result = await generateImage(contentPieceId, { size, quality });
      setImageUrl(result.imageUrl);
      setImageSource("generated");
      setShowPromptEditor(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload PNG, JPG, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await uploadContentImage(contentPieceId, formData);
      setImageUrl(result.imageUrl);
      setImageSource("uploaded");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteContentImage(contentPieceId);
      setImageUrl(null);
      setImageSource(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePrompt = async () => {
    try {
      await updateImagePrompt(contentPieceId, editedPrompt);
      setPromptUsed(editedPrompt);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    }
  };

  // --- Render ---

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 p-4 dark:border-white/[0.06]">
      {/* Error display */}
      {error && (
        <div className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-300 hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Image preview */}
      {imageUrl && (
        <div className="mb-3">
          <img
            src={imageUrl}
            alt="Generated content image"
            className="w-full rounded-lg"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">
              {imageSource === "generated" ? "AI Generated" : "Uploaded"}
            </span>
            <a
              href={imageUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Download
            </a>
            <div className="flex-1" />
            {imageSource === "generated" && (
              <button
                onClick={() => setShowPromptEditor(!showPromptEditor)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Edit Prompt
              </button>
            )}
            {imageSource === "uploaded" ? (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Replace
                </button>
                <button
                  onClick={() => {
                    if (!editedPrompt) setEditedPrompt(promptUsed || body);
                    setShowPromptEditor(true);
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-300"
                >
                  Generate AI Image Instead
                </button>
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Upload Instead
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-red-400 hover:text-red-300"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      {/* Prompt editor */}
      {showPromptEditor && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Image Prompt
          </label>
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-100"
          />
          <div className="mt-1 flex gap-2">
            <button
              onClick={handleSavePrompt}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Save Prompt
            </button>
          </div>
        </div>
      )}

      {/* Generation/Upload controls (shown when no image, or when image exists for regeneration) */}
      {!isGenerating && !isUploading && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Aspect ratio selector */}
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as ImageSize)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-300 [&>option]:bg-white dark:[&>option]:bg-zinc-900"
          >
            {Object.entries(SIZE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* HD toggle */}
          <label className="flex items-center gap-1 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={quality === "high"}
              onChange={(e) => setQuality(e.target.checked ? "high" : "medium")}
              className="rounded border-zinc-300 text-indigo-500 focus:ring-indigo-500/30 dark:border-zinc-600"
            />
            HD
          </label>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            className="rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            {imageUrl ? "Regenerate" : "Generate Image"}
          </button>

          {/* Upload button (when no image yet) */}
          {!imageUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.1] dark:text-zinc-300 dark:hover:bg-white/[0.03]"
            >
              Upload Image
            </button>
          )}

          {/* Prompt preview toggle (when no image yet) */}
          {!imageUrl && !showPromptEditor && (
            <button
              onClick={() => {
                // Initialize prompt from body if not set yet
                if (!editedPrompt) setEditedPrompt(promptUsed || body);
                setShowPromptEditor(true);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-300"
            >
              Edit Prompt
            </button>
          )}
        </div>
      )}

      {/* Loading states */}
      {isGenerating && (
        <div className="flex items-center gap-2 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
          <span className="text-sm text-zinc-400">Generating image...</span>
        </div>
      )}
      {isUploading && (
        <div className="flex items-center gap-2 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
          <span className="text-sm text-zinc-400">Uploading...</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `cd apps/app && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add apps/app/components/image-generator.tsx
git commit -m "feat: add ImageGenerator component with generate, upload, edit, delete"
```

---

### Task 6: Integrate ImageGenerator into Content List

**Files:**
- Modify: `apps/app/app/(dashboard)/content/content-list.tsx`

- [ ] **Step 1: Add image fields to the ContentPieceRow interface**

Find the `ContentPieceRow` interface (around line 21) and add the three new fields:

```typescript
image_url: string | null;
image_source: "generated" | "uploaded" | null;
image_prompt_used: string | null;
```

- [ ] **Step 2: Add image fields to the server query**

Find the `.select()` in the content page server component (`apps/app/app/(dashboard)/content/page.tsx`). Add `image_url, image_source, image_prompt_used` to the select string, just as was done in `loadContentForCampaign()`.

- [ ] **Step 3: Add image thumbnail to content cards**

In the content card rendering (around line 378), add a small thumbnail when `image_url` exists. Add this near the top of the card, after the pills/header area:

```typescript
{piece.image_url && (
  <div className="mt-2">
    <img
      src={piece.image_url}
      alt=""
      className="h-16 w-16 rounded-md object-cover"
    />
  </div>
)}
```

- [ ] **Step 4: Add ImageGenerator to the expanded content view**

In the expanded body section (around where body is shown with `whitespace-pre-wrap`), add the `ImageGenerator` component for `image-prompt` type pieces. **Important:** Place the `ImageGenerator` OUTSIDE any `<button>` wrapper — nesting interactive elements causes React hydration errors. Add it ABOVE the body text:

```typescript
{piece.type === "image-prompt" && (
  <ImageGenerator
    contentPieceId={piece.id}
    imageUrl={piece.image_url}
    imageSource={piece.image_source}
    imagePromptUsed={piece.image_prompt_used}
    body={piece.body}
    channel={piece.metadata?.channel}
  />
)}
```

Add the import at the top of the file:
```typescript
import ImageGenerator from "@/components/image-generator";
```

- [ ] **Step 5: Verify build**

Run: `cd apps/app && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add apps/app/app/(dashboard)/content/content-list.tsx apps/app/app/(dashboard)/content/page.tsx
git commit -m "feat: integrate ImageGenerator into content list with thumbnails"
```

---

### Task 7: Integrate ImageGenerator into Campaign Panel

**Files:**
- Modify: `apps/app/app/(dashboard)/campaigns/campaign-panel.tsx`

- [ ] **Step 1: Add image fields to the ContentPiece interface**

Find the `ContentPiece` interface (around line 22) in the campaign panel and add:

```typescript
image_url: string | null;
image_source: "generated" | "uploaded" | null;
image_prompt_used: string | null;
```

- [ ] **Step 2: Add ImageGenerator to expanded content in the panel**

In the expanded body section (around line 328-359), add the `ImageGenerator` component for `image-prompt` type pieces. Insert it before the body text display:

```typescript
{cp.type === "image-prompt" && (
  <ImageGenerator
    contentPieceId={cp.id}
    imageUrl={cp.image_url}
    imageSource={cp.image_source}
    imagePromptUsed={cp.image_prompt_used}
    body={cp.body}
    channel={campaign.channel}
  />
)}
```

Add the import at the top of the file:
```typescript
import ImageGenerator from "@/components/image-generator";
```

- [ ] **Step 3: Verify build**

Run: `cd apps/app && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add apps/app/app/(dashboard)/campaigns/campaign-panel.tsx
git commit -m "feat: integrate ImageGenerator into campaign panel"
```

---

### Task 8: Integrate Image Preview into Schedule Calendar

**Files:**
- Modify: `apps/app/app/(dashboard)/schedule/schedule-calendar.tsx`

- [ ] **Step 1: Add image fields to the SchedulePiece interface**

Find the `SchedulePiece` interface (around line 12) and add:

```typescript
image_url: string | null;
image_source: "generated" | "uploaded" | null;
image_prompt_used: string | null;
```

- [ ] **Step 2: Add image fields to the schedule page server query**

In `apps/app/app/(dashboard)/schedule/page.tsx`, add `image_url, image_source, image_prompt_used` to both `.select()` calls (scheduled pieces query and unscheduled pieces query).

- [ ] **Step 3: Add image thumbnail in the schedule detail panel**

In the slide-over detail panel (around line 415-504), add an image preview when `image_url` exists. Add it before the body text section:

```typescript
{selectedPiece.image_url && (
  <div className="mb-3">
    <img
      src={selectedPiece.image_url}
      alt=""
      className="w-full rounded-lg"
    />
  </div>
)}
```

- [ ] **Step 4: Verify build**

Run: `cd apps/app && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add apps/app/app/(dashboard)/schedule/schedule-calendar.tsx apps/app/app/(dashboard)/schedule/page.tsx
git commit -m "feat: add image preview to schedule calendar detail panel"
```

---

### Task 9: Manual Testing & Final Verification

- [ ] **Step 1: Create the `content-images` bucket in Supabase**

Go to Supabase Dashboard → Storage → Create new bucket:
- Name: `content-images`
- Public: Yes
- File size limit: 5MB
- Allowed MIME types: `image/png, image/jpeg, image/webp`

- [ ] **Step 2: Apply migration 00019**

Run the migration SQL from `supabase/migrations/00019_image_generation.sql` in the Supabase SQL Editor.

- [ ] **Step 3: Add OPENAI_API_KEY to `.env.local`**

Add the user's OpenAI API key to `apps/app/.env.local`.

- [ ] **Step 4: Test image generation end-to-end**

1. Navigate to Content page → find an `image-prompt` type content piece
2. Expand the content piece → verify `ImageGenerator` component appears
3. Check the aspect ratio dropdown defaults correctly for the channel
4. Click "Generate Image" → verify loading spinner appears
5. After generation: verify image preview appears, "AI Generated" label shown
6. Click "Edit Prompt" → verify prompt text is shown and editable
7. Edit prompt → click "Regenerate" → verify new image replaces old one
8. Verify image persists on page reload

- [ ] **Step 5: Test image upload**

1. On a content piece with no image → click "Upload Image"
2. Select a JPG file under 5MB → verify upload succeeds
3. Verify "Uploaded" label shown instead of "AI Generated"
4. Click "Replace" → upload a different image → verify replacement
5. Try uploading a file > 5MB → verify error message
6. Try uploading a .gif → verify error message

- [ ] **Step 6: Test image deletion**

1. On a content piece with an image → click "Delete"
2. Verify image disappears and generate/upload controls return
3. Verify page reload shows no image

- [ ] **Step 7: Test in campaign panel**

1. Open a campaign with `image-prompt` content → expand a piece
2. Verify ImageGenerator appears and works the same as content page

- [ ] **Step 8: Test on schedule page**

1. Schedule an `image-prompt` piece that has a generated image
2. Click the calendar card → verify image preview in detail panel

- [ ] **Step 9: Test content regeneration cleanup**

1. Generate images for a campaign's content pieces
2. Click "Regenerate Content" on the campaign
3. Verify old images are cleaned up from Supabase Storage (check Storage browser in dashboard)

- [ ] **Step 10: Test both light and dark mode**

Verify the ImageGenerator component looks correct in both themes:
- Borders, backgrounds, text colors, buttons all theme-appropriate
- No white-on-white or invisible elements

- [ ] **Step 11: Final commit**

If any adjustments were needed during testing:
```bash
git add -A
git commit -m "fix: adjustments from image generation manual testing"
```
