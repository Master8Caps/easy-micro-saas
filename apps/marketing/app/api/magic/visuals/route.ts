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
