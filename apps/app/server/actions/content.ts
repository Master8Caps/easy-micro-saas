"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

// ── Type mapping ─────────────────────────────────────
function mapContentType(contentType: string, channel: string): string {
  const key = contentType.toLowerCase();
  const ch = channel.toLowerCase();

  if (key === "text-post") {
    if (ch.includes("linkedin")) return "linkedin-post";
    if (ch.includes("twitter") || ch.includes("x")) return "twitter-post";
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
function getFormatInstructions(type: string): string {
  switch (type) {
    case "linkedin-post":
      return "Write LinkedIn posts. 150-300 words. Use short paragraphs and line breaks for readability. Open with a hook line that stops the scroll. End with a question or CTA. No hashtags unless essential.";
    case "twitter-post":
      return "Write tweets. Max 280 characters each. Punchy, opinionated, curiosity-driven. No hashtags unless essential.";
    case "twitter-thread":
      return "Write a Twitter/X thread of 4-7 tweets. First tweet is the hook. Use numbered format (1/, 2/, etc). Last tweet has the CTA. Each tweet under 280 characters.";
    case "video-script":
      return "Write a 60-90 second video script. Include [VISUAL] cues. Hook in first 3 seconds. Problem, agitation, solution structure. End with clear CTA.";
    case "image-prompt":
      return "Write detailed image generation prompts for AI tools (Midjourney/DALL-E). Include style, mood, composition, and text overlay suggestions. Also include a caption for the social post.";
    case "landing-page-copy":
      return "Write landing page sections: headline, subheadline, 3 benefit blocks (heading + description), social proof placeholder, and CTA section.";
    case "email":
      return "Write marketing emails. Include subject line, preview text, body (3-5 short paragraphs), and CTA button text. Conversational tone, one clear goal per email.";
    case "ad-copy":
      return "Write ad copy variations. Include: headline (max 30 chars), primary text (125 chars), description (30 chars). Provide variations with different angles.";
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
  const formatInstructions = getFormatInstructions(contentPieceType);

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
    .select("id, avatar_id, angle, channel, hook, content_type")
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
    .select("name, description, market")
    .eq("id", input.productId)
    .single();

  if (!product) return { error: "Product not found" };

  const contentPieceType = mapContentType(campaign.content_type, campaign.channel);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: buildContentPrompt(campaign, avatar, product, contentPieceType),
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
      pieces: { title: string; body: string; cta_text?: string; notes?: string }[];
    } = JSON.parse(jsonMatch[0]);

    // Insert content pieces
    const inserts = output.pieces.map((piece) => ({
      product_id: input.productId,
      campaign_id: input.campaignId,
      avatar_id: campaign.avatar_id,
      type: contentPieceType,
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

    return { pieces: savedPieces ?? [] };
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
    .select("id, type, title, body, metadata, status, archived, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { pieces: data ?? [] };
}

// ── Update content piece status ──────────────────────
export async function updateContentPieceStatus(
  pieceId: string,
  status: "draft" | "ready" | "published",
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("content_pieces")
    .update({ status })
    .eq("id", pieceId);

  if (error) return { error: error.message };
  return { success: true };
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
  return { success: true };
}
