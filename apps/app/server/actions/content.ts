"use server";

import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createTrackedLink } from "./links";

const anthropic = new Anthropic();

// ── Type mapping ─────────────────────────────────────
function mapContentType(contentType: string, channel: string): string {
  const key = contentType.toLowerCase();
  const ch = channel.toLowerCase();

  if (key === "text-post") {
    if (ch.includes("email")) return "email";
    if (ch.includes("linkedin")) return "linkedin-post";
    if (ch.includes("twitter") || ch.includes("x")) return "twitter-post";
    if (ch.includes("facebook")) return "facebook-post";
    if (ch.includes("instagram")) return "image-prompt";
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

// ── Format instructions per content type ─────────────
function getFormatInstructions(type: string, channel?: string): string {
  const ch = channel?.toLowerCase() ?? "";

  switch (type) {
    case "linkedin-post":
      return "Write LinkedIn posts. 150-300 words. Use short paragraphs and line breaks for readability. Open with a hook line that stops the scroll. End with a question or CTA. No hashtags unless essential.";
    case "twitter-post":
      return "Write tweets. Max 280 characters each. Punchy, opinionated, curiosity-driven. No hashtags unless essential.";
    case "facebook-post":
      return "Write Facebook posts. 100-250 words. Conversational and relatable tone. Open with a hook. Use short paragraphs. End with a question or CTA to drive engagement. Emoji usage is acceptable but not excessive.";
    case "twitter-thread":
      return "Write a Twitter/X thread of 4-7 tweets. First tweet is the hook. Use numbered format (1/, 2/, etc). Last tweet has the CTA. Each tweet under 280 characters.";
    case "video-script":
      if (ch.includes("instagram"))
        return "Write an Instagram Reels script (15-60 seconds, vertical 9:16). Hook in first 2 seconds — pattern interrupt that stops the scroll. Keep it native and authentic, not overly polished. Include [VISUAL] cues and [TEXT OVERLAY] notes. End with a clear CTA. Also include a short caption (1-2 sentences) with 3-5 relevant hashtags.";
      return "Write a 60-90 second video script. Include [VISUAL] cues. Hook in first 3 seconds. Problem, agitation, solution structure. End with clear CTA.";
    case "image-prompt":
      if (ch.includes("instagram"))
        return "Write an Instagram image post. Include: 1) A detailed image generation prompt for AI tools (Midjourney/DALL-E) with style, mood, composition, and any text overlay suggestions. 2) An Instagram caption (100-200 words) with a strong hook line, line breaks for readability, a clear CTA, and 3-5 relevant hashtags at the end. Conversational, authentic tone.";
      return "Write detailed image generation prompts for AI tools (Midjourney/DALL-E). Include style, mood, composition, and text overlay suggestions. Also include a caption for the social post.";
    case "landing-page-copy":
      return "Write landing page sections: headline, subheadline, 3 benefit blocks (heading + description), social proof placeholder, and CTA section.";
    case "email":
      return "Write marketing emails. Include subject line, preview text, body (3-5 short paragraphs), and CTA button text. Conversational tone, one clear goal per email.";
    case "ad-copy":
      return `Write ad copy using proven direct-response frameworks (PAS, AIDA, BAB).
For each variation include:
- Primary text (40-125 characters): benefit-driven, creates urgency or curiosity
- Headline (max 40 characters): clear value proposition, specific numbers when possible
- Description (max 30 characters): reinforce the CTA
- CTA suggestion (e.g. "Learn More", "Sign Up Free", "Get Started")
Write 2-3 variations with different angles (pain-point, benefit, social-proof).`;
    default:
      return "Write content appropriate for the channel. Keep it specific and actionable.";
  }
}

// ── Prompt builder ───────────────────────────────────
function buildContentPrompt(
  campaign: {
    angle: string;
    channel: string;
    hook: string;
    content_type: string;
  },
  avatar: {
    name: string;
    description: string;
    pain_points: string[];
    icp_details: { role?: string; context?: string; motivation?: string };
  },
  product: {
    name: string;
    description: string;
    market: string;
  },
  contentPieceType: string,
): string {
  const formatInstructions = getFormatInstructions(contentPieceType, campaign.channel);

  return `You are a world-class content marketer. Generate 2-3 high-quality content pieces for the campaign described below.

PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- Market: ${product.market}

TARGET AVATAR:
- Name: ${avatar.name}
- Who they are: ${avatar.description}
- Pain points: ${avatar.pain_points.join(", ")}
- Role: ${avatar.icp_details?.role ?? "N/A"}
- Context: ${avatar.icp_details?.context ?? "N/A"}
- Motivation: ${avatar.icp_details?.motivation ?? "N/A"}

CAMPAIGN:
- Channel: ${campaign.channel}
- Content type: ${campaign.content_type}
- Angle: ${campaign.angle}
- Opening hook: ${campaign.hook}

CONTENT FORMAT: ${contentPieceType}
${formatInstructions}

RULES:
1. Each piece must be ready to use — no placeholders like [insert X here].
2. Use the hook as inspiration but vary the openings across pieces.
3. Write for the specific avatar — use their language, reference their pain points.
4. Include a subtle call-to-action in each piece.
5. Keep the tone conversational and authoritative, not salesy.

Respond with ONLY valid JSON:
{
  "pieces": [
    {
      "title": "A short internal title for this piece",
      "body": "The full content, ready to post",
      "cta_text": "The call-to-action text used in the piece",
      "notes": "Brief note on what makes this piece effective"
    }
  ]
}`;
}

// ── Ad content prompt builder ────────────────────────
function buildAdContentPrompt(
  campaign: {
    angle: string;
    channel: string;
    hook: string;
    content_type: string;
  },
  avatar: {
    name: string;
    description: string;
    pain_points: string[];
    icp_details: { role?: string; context?: string; motivation?: string };
  },
  product: {
    name: string;
    description: string;
    market: string;
  },
  contentFormats: string[],
): string {
  const isGoogle = campaign.channel.toLowerCase().includes("google");
  const wantsImages = contentFormats.includes("images") && !isGoogle;
  const wantsVideo = contentFormats.includes("video") && !isGoogle;

  const sections: string[] = [];

  sections.push(`**AD COPY** (required — 2-3 variations)
Use proven direct-response frameworks (PAS, AIDA, BAB). For each variation:
- Primary text (40-125 characters): benefit-driven, urgency or curiosity
- Headline (max 40 characters): clear value proposition, use specific numbers when possible
- Description (max 30 characters): reinforce the CTA
- CTA suggestion (e.g. "Learn More", "Sign Up Free", "Get Started")
Use different angles: pain-point, benefit, social-proof.
content_type: "ad-copy"`);

  if (wantsImages) {
    sections.push(`**AD IMAGE CREATIVE** (1-2 pieces)
Write detailed image briefs for the ad creative:
- Visual concept: what the image shows, composition, focal point
- Text overlay: headline and any text to appear on the image
- Style direction: colors, mood, aesthetic (match the brand and platform)
- Why it stops the scroll: what makes this visually compelling
content_type: "image-prompt"`);
  }

  if (wantsVideo) {
    sections.push(`**AD VIDEO SCRIPT** (1 piece)
Write a 15-30 second ad video script:
- Hook (first 3 seconds): pattern interrupt that stops the scroll
- Problem/agitation (5-10 seconds): make the viewer feel the pain
- Solution reveal (5-10 seconds): introduce the product as the answer
- CTA (3-5 seconds): clear next step
Include [VISUAL] cues and [TEXT OVERLAY] notes.
content_type: "video-script"`);
  }

  return `You are a world-class performance marketer who has spent millions on paid ads. Generate a complete ad creative package for the campaign below.

PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- Market: ${product.market}

TARGET AVATAR:
- Name: ${avatar.name}
- Who they are: ${avatar.description}
- Pain points: ${avatar.pain_points.join(", ")}
- Role: ${avatar.icp_details?.role ?? "N/A"}
- Context: ${avatar.icp_details?.context ?? "N/A"}
- Motivation: ${avatar.icp_details?.motivation ?? "N/A"}

AD CAMPAIGN:
- Platform: ${campaign.channel}
- Angle: ${campaign.angle}
- Hook: ${campaign.hook}

GENERATE THE FOLLOWING:

${sections.join("\n\n")}

RULES:
1. Every piece must be ready to use — no placeholders.
2. Use the hook as inspiration but vary approaches across pieces.
3. Write for the specific avatar — use their language, reference their pain points.
4. Be specific and benefit-driven, not generic or salesy.
5. Each ad copy variation should use a different framework (PAS, AIDA, or BAB).
${isGoogle ? "6. This is for Google Ads — focus on search intent and keyword relevance." : `6. This is for ${campaign.channel} — prioritize visual stopping power and native feel.`}

Respond with ONLY valid JSON:
{
  "pieces": [
    {
      "content_type": "ad-copy or image-prompt or video-script",
      "title": "A short internal title for this piece",
      "body": "The full content",
      "cta_text": "The call-to-action text",
      "notes": "Brief note on strategy/framework used"
    }
  ]
}`;
}

// ── Generate content for a single campaign ───────────
interface GenerateContentInput {
  campaignId: string;
  productId: string;
}

export async function generateContentForCampaign(input: GenerateContentInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, avatar_id, angle, channel, hook, content_type, category, destination_url")
    .eq("id", input.campaignId)
    .single();

  if (!campaign) return { error: "Campaign not found" };

  // Fetch avatar
  const { data: avatar } = await supabase
    .from("avatars")
    .select("name, description, pain_points, icp_details")
    .eq("id", campaign.avatar_id)
    .single();

  if (!avatar) return { error: "Avatar not found" };

  // Fetch product
  const { data: product } = await supabase
    .from("products")
    .select("name, description, market, website_url, content_formats")
    .eq("id", input.productId)
    .single();

  if (!product) return { error: "Product not found" };

  const isAdCampaign = campaign.category === "ad";
  const contentPieceType = mapContentType(campaign.content_type, campaign.channel);

  try {
    const prompt = isAdCampaign
      ? buildAdContentPrompt(campaign, avatar, product, product.content_formats ?? ["text"])
      : buildContentPrompt(campaign, avatar, product, contentPieceType);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const output: {
      pieces: { content_type?: string; title: string; body: string; cta_text?: string; notes?: string }[];
    } = JSON.parse(jsonMatch[0]);

    // Delete existing content pieces for this campaign before inserting new ones
    await supabase
      .from("content_pieces")
      .delete()
      .eq("campaign_id", input.campaignId);

    // Insert content pieces
    const inserts = output.pieces.map((piece) => ({
      product_id: input.productId,
      campaign_id: input.campaignId,
      avatar_id: campaign.avatar_id,
      type: isAdCampaign ? (piece.content_type ?? "ad-copy") : contentPieceType,
      title: piece.title,
      body: piece.body,
      metadata: {
        cta_text: piece.cta_text,
        notes: piece.notes,
        channel: campaign.channel,
        angle: campaign.angle,
      },
      status: "draft" as const,
    }));

    const { data: savedPieces, error: insertError } = await supabase
      .from("content_pieces")
      .insert(inserts)
      .select("id, type, title, body, metadata, status, archived, created_at");

    if (insertError) return { error: insertError.message };

    // Auto-generate tracked links if destination URL is available
    const destinationUrl = campaign.destination_url || product.website_url;
    if (destinationUrl && savedPieces) {
      await Promise.allSettled(
        savedPieces.map((piece) =>
          createTrackedLink({
            productId: input.productId,
            campaignId: input.campaignId,
            contentPieceId: piece.id,
            destinationUrl,
            channel: campaign.channel,
            category: campaign.category ?? "social",
            angle: campaign.angle,
            contentTitle: piece.title ?? "",
          }),
        ),
      );
    }

    revalidatePath("/content");

    // Re-fetch pieces with tracked links included
    const freshData = await loadContentForCampaign(input.campaignId);
    return { pieces: freshData.pieces ?? [] };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Content generation failed",
    };
  }
}

// ── Bulk generate for multiple campaigns ─────────────
interface BulkGenerateInput {
  productId: string;
  campaignIds: string[];
}

export async function generateContentBulk(input: BulkGenerateInput) {
  const results = await Promise.allSettled(
    input.campaignIds.map((campaignId) =>
      generateContentForCampaign({ campaignId, productId: input.productId }),
    ),
  );

  const successes: { campaignId: string; pieces: typeof results extends PromiseSettledResult<infer T>[] ? T extends { pieces: infer P } ? P : never : never }[] = [];
  const failures: { campaignId: string; error: string }[] = [];

  results.forEach((result, i) => {
    const campaignId = input.campaignIds[i];
    if (result.status === "fulfilled" && result.value.pieces) {
      successes.push({ campaignId, pieces: result.value.pieces });
    } else {
      const errMsg =
        result.status === "rejected"
          ? result.reason?.message ?? "Unknown error"
          : result.value.error ?? "Unknown error";
      failures.push({ campaignId, error: errMsg });
    }
  });

  return { successes, failures };
}

// ── Load content pieces for a campaign ───────────────
export async function loadContentForCampaign(campaignId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("content_pieces")
    .select("id, type, title, body, metadata, status, archived, posted_at, scheduled_for, created_at, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at, links(id, slug, click_count)")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { pieces: data ?? [] };
}

// ── Update content piece lifecycle status ────────────
export async function updateContentPieceStatus(
  pieceId: string,
  newStatus: "draft" | "approved" | "scheduled" | "posted",
  scheduledFor?: string | null,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const updates: {
    status: string;
    posted_at?: string | null;
    scheduled_for?: string | null;
  } = { status: newStatus };

  switch (newStatus) {
    case "draft":
      updates.posted_at = null;
      updates.scheduled_for = null;
      break;
    case "approved":
      updates.posted_at = null;
      updates.scheduled_for = null;
      break;
    case "scheduled":
      if (!scheduledFor) return { error: "Date is required for scheduling" };
      if (isNaN(new Date(scheduledFor).getTime())) return { error: "Invalid date format" };
      updates.scheduled_for = scheduledFor;
      updates.posted_at = null;
      break;
    case "posted":
      updates.posted_at = new Date().toISOString();
      break;
  }

  const { error } = await supabase
    .from("content_pieces")
    .update(updates)
    .eq("id", pieceId);

  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath("/schedule");
  revalidatePath("/campaigns");

  return { success: true };
}

// ── Bulk update content piece lifecycle status ───────
export async function updateContentPiecesStatusBulk(
  pieceIds: string[],
  newStatus: "approved" | "scheduled" | "posted",
  scheduledFor?: string | null,
) {
  if (!pieceIds.length) return { error: "No pieces selected" };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const updates: {
    status: string;
    posted_at?: string | null;
    scheduled_for?: string | null;
  } = { status: newStatus };

  switch (newStatus) {
    case "approved":
      updates.posted_at = null;
      updates.scheduled_for = null;
      break;
    case "scheduled":
      if (!scheduledFor) return { error: "Date is required for scheduling" };
      if (isNaN(new Date(scheduledFor).getTime())) return { error: "Invalid date format" };
      updates.scheduled_for = scheduledFor;
      updates.posted_at = null;
      break;
    case "posted":
      updates.posted_at = new Date().toISOString();
      break;
  }

  const { error, count } = await supabase
    .from("content_pieces")
    .update(updates)
    .in("id", pieceIds);

  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath("/schedule");
  revalidatePath("/campaigns");

  return { success: true, updatedCount: count ?? pieceIds.length };
}

// ── Toggle content piece archived flag ───────────────
export async function toggleContentPieceArchived(
  pieceId: string,
  archived: boolean,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({ archived })
    .eq("id", pieceId);

  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath("/archive");

  return { success: true };
}

// ── Update content piece scheduled date ─────────────
export async function updateContentPieceSchedule(
  pieceId: string,
  scheduledFor: string | null,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const updates = {
    scheduled_for: scheduledFor,
    status: scheduledFor ? "scheduled" : "approved",
  };

  const { error } = await supabase
    .from("content_pieces")
    .update(updates)
    .eq("id", pieceId);

  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath("/schedule");

  return { success: true };
}

// ── Update content piece rating ──────────────────────
export async function updateContentRating(
  pieceId: string,
  rating: -1 | 0 | 1,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({ rating })
    .eq("id", pieceId);

  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");
  return { success: true };
}

// ── Update content piece engagement metrics ──────────
export async function updateContentEngagement(
  pieceId: string,
  engagement: {
    views?: number | null;
    likes?: number | null;
    comments?: number | null;
    shares?: number | null;
  },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({
      engagement_views: engagement.views ?? null,
      engagement_likes: engagement.likes ?? null,
      engagement_comments: engagement.comments ?? null,
      engagement_shares: engagement.shares ?? null,
      engagement_logged_at: new Date().toISOString(),
    })
    .eq("id", pieceId);

  if (error) return { error: error.message };

  revalidatePath("/content");
  revalidatePath("/campaigns");
  revalidatePath("/schedule");
  return { success: true };
}
