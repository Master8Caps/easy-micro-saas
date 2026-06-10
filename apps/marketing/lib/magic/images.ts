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
