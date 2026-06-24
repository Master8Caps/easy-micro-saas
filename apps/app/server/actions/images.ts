"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

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
  return (CHANNEL_ASPECT_RATIOS[channel.toLowerCase()] ||
    DEFAULT_SIZE) as ImageSize;
}

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
  if (!prompt || prompt.length < 10)
    throw new Error("No image prompt available");

  // Determine size from options or channel default
  const channel = (piece.metadata as Record<string, string>)?.channel;
  const size = options?.size || getDefaultSize(channel);
  const quality = options?.quality || "medium";

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

  // Update content piece
  const { error: updateError } = await supabase
    .from("content_pieces")
    .update({
      image_url: imageUrl,
      image_source: "generated",
      image_prompt_used: piece.image_prompt_used || prompt,
    })
    .eq("id", contentPieceId);

  if (updateError)
    throw new Error(`Failed to save image URL: ${updateError.message}`);

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");

  return { imageUrl };
}

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

  if (uploadError)
    throw new Error(`Failed to upload image: ${uploadError.message}`);

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

  if (updateError)
    throw new Error(`Failed to save image URL: ${updateError.message}`);

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");

  return { imageUrl };
}

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

  if (updateError)
    throw new Error(`Failed to clear image data: ${updateError.message}`);

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
