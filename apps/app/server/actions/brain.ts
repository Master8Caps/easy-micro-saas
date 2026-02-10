"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

interface GenerateBrainInput {
  productId: string;
}

interface BrainAvatar {
  name: string;
  description: string;
  pain_points: string[];
  channels: string[];
  icp_details: {
    role: string;
    context: string;
    motivation: string;
  };
}

interface BrainCampaign {
  avatar_name: string;
  angle: string;
  channel: string;
  hook: string;
  content_type: string;
  why_it_works: string;
}

interface BrainAdCampaign {
  avatar_name: string;
  angle: string;
  platform: string;
  ad_format: string;
  hook: string;
  strategy: string;
  why_it_works: string;
}

interface BrainWebsiteKit {
  landing_page: {
    headline: string;
    subheadline: string;
    benefits: { heading: string; description: string }[];
    social_proof_section: string;
    cta_text: string;
  };
  welcome_emails: { subject: string; body: string }[];
  meta_description: string;
  taglines: string[];
}

interface BrainOutput {
  avatars: BrainAvatar[];
  campaigns: BrainCampaign[];
  ad_campaigns?: BrainAdCampaign[];
  website_kit?: BrainWebsiteKit;
  positioning_summary: string;
}

export async function generateBrain(input: GenerateBrainInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch the product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", input.productId)
    .single();

  if (productError || !product) {
    return { error: "Product not found" };
  }

  // Create a generation record
  const { data: generation, error: genError } = await supabase
    .from("generations")
    .insert({
      product_id: product.id,
      model: "claude-sonnet-4-20250514",
      prompt_version: "2.0",
      status: "processing",
    })
    .select("id")
    .single();

  if (genError || !generation) {
    return { error: "Failed to create generation record" };
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: buildPrompt(product),
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Extract JSON from the response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const brainOutput: BrainOutput = JSON.parse(jsonMatch[0]);

    // Save raw output to generation
    await supabase
      .from("generations")
      .update({
        raw_output: brainOutput,
        status: "completed",
      })
      .eq("id", generation.id);

    // Save avatars
    const avatarInserts = brainOutput.avatars.map((avatar) => ({
      product_id: product.id,
      generation_id: generation.id,
      name: avatar.name,
      description: avatar.description,
      pain_points: avatar.pain_points,
      channels: avatar.channels,
      icp_details: avatar.icp_details,
    }));

    const { data: savedAvatars } = await supabase
      .from("avatars")
      .insert(avatarInserts)
      .select("id, name");

    // Save social campaigns
    if (savedAvatars) {
      const avatarMap = new Map(
        savedAvatars.map((a) => [a.name, a.id]),
      );

      const socialInserts = brainOutput.campaigns.map((campaign) => ({
        product_id: product.id,
        avatar_id: avatarMap.get(campaign.avatar_name) || savedAvatars[0].id,
        generation_id: generation.id,
        angle: campaign.angle,
        channel: campaign.channel,
        hook: campaign.hook,
        content_type: campaign.content_type,
        category: "social" as const,
        status: "draft" as const,
      }));

      await supabase.from("campaigns").insert(socialInserts);

      // Save ad campaigns
      if (brainOutput.ad_campaigns && brainOutput.ad_campaigns.length > 0) {
        const adInserts = brainOutput.ad_campaigns.map((ad) => ({
          product_id: product.id,
          avatar_id: avatarMap.get(ad.avatar_name) || savedAvatars[0].id,
          generation_id: generation.id,
          angle: ad.angle,
          channel: ad.platform,
          hook: ad.hook,
          content_type: "ad-copy" as const,
          category: "ad" as const,
          status: "draft" as const,
        }));

        await supabase.from("campaigns").insert(adInserts);
      }
    }

    // Save website kit as content pieces
    if (brainOutput.website_kit) {
      const kit = brainOutput.website_kit;
      const websitePieces: {
        product_id: string;
        type: string;
        title: string;
        body: string;
        metadata: Record<string, unknown>;
        status: string;
      }[] = [];

      // Landing page copy
      const landingBody = [
        `# ${kit.landing_page.headline}`,
        kit.landing_page.subheadline,
        "",
        ...kit.landing_page.benefits.map(
          (b) => `## ${b.heading}\n${b.description}`,
        ),
        "",
        `## Social Proof\n${kit.landing_page.social_proof_section}`,
        "",
        `**CTA:** ${kit.landing_page.cta_text}`,
      ].join("\n\n");

      websitePieces.push({
        product_id: product.id,
        type: "landing-page-copy",
        title: "Landing Page Copy",
        body: landingBody,
        metadata: { structured: kit.landing_page },
        status: "draft",
      });

      // Welcome emails
      kit.welcome_emails.forEach((email, i) => {
        websitePieces.push({
          product_id: product.id,
          type: "email-sequence",
          title: `Welcome Email ${i + 1}: ${email.subject}`,
          body: email.body,
          metadata: { subject: email.subject, sequence_order: i + 1 },
          status: "draft",
        });
      });

      // Meta description
      websitePieces.push({
        product_id: product.id,
        type: "meta-description",
        title: "Meta Description",
        body: kit.meta_description,
        metadata: {},
        status: "draft",
      });

      // Taglines
      kit.taglines.forEach((tagline, i) => {
        websitePieces.push({
          product_id: product.id,
          type: "tagline",
          title: `Tagline Option ${i + 1}`,
          body: tagline,
          metadata: {},
          status: "draft",
        });
      });

      await supabase.from("content_pieces").insert(websitePieces);
    }

    return { generationId: generation.id, output: brainOutput };
  } catch (err) {
    // Mark generation as failed
    await supabase
      .from("generations")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", generation.id);

    return {
      error: err instanceof Error ? err.message : "Generation failed",
    };
  }
}

function buildPrompt(product: {
  name: string;
  description: string;
  market: string;
  goals: string;
  channels: string[];
  has_website?: boolean;
  website_url?: string;
  wants_ads?: boolean;
  ad_platforms?: string[];
}): string {
  const socialChannels = product.channels.filter(
    (c) => c.toLowerCase() !== "paid ads",
  );

  let prompt = `You are a marketing strategist specializing in early-stage SaaS growth. Your job is to analyze a product brief and generate a structured marketing brain.

PRODUCT BRIEF:
- Name: ${product.name}
- Description: ${product.description}
- Target market: ${product.market}
- Goals: ${product.goals}
- Social channels: ${socialChannels.join(", ")}`;

  if (product.has_website && product.website_url) {
    prompt += `\n- Website: ${product.website_url}`;
  }

  if (product.wants_ads && product.ad_platforms && product.ad_platforms.length > 0) {
    prompt += `\n- Ad platforms: ${product.ad_platforms.join(", ")}`;
  }

  prompt += `

INSTRUCTIONS:
1. Identify 2-3 distinct target avatars (ideal customer profiles). Each should be specific and actionable, not generic.
2. For each avatar, generate 2-3 SOCIAL campaign angles with specific hooks. Each campaign targets one social channel and one avatar.
3. Hooks should be ready to use as the opening line of a social post — specific, provocative, and curiosity-driven.
4. Social content types must be one of: text-post, thread, video-hook, video-script, image-prompt
5. Use a VARIETY of content types — do not default to text-post for everything. Include at least one image-prompt and one video-hook or video-script if the channels support it.`;

  if (product.wants_ads) {
    prompt += `
6. Generate 2-3 AD CAMPAIGNS for paid advertising. Mix of:
   - Retargeting ads: take the strongest social campaign angle and adapt it for paid ads
   - Cold traffic ads: dedicated conversion-focused angles for people who haven't heard of the product
   Each ad campaign needs: angle, platform (from the ad platforms listed), ad_format (single-image, carousel, or video), hook, strategy (retargeting or cold-traffic), and why_it_works.`;
  }

  if (product.has_website) {
    prompt += `
${product.wants_ads ? "7" : "6"}. Generate a WEBSITE KIT with:
   - Landing page copy: headline, subheadline, 3 benefit blocks (heading + description), social proof section suggestion, CTA button text
   - 3 welcome emails: subject line + body for a drip sequence (welcome, value, nudge-to-action)
   - Meta description (under 160 chars)
   - 3 tagline options`;
  }

  prompt += `

Respond with ONLY valid JSON in this exact structure:
{
  "avatars": [
    {
      "name": "Avatar Name",
      "description": "Who they are and their context",
      "pain_points": ["Pain point 1", "Pain point 2", "Pain point 3"],
      "channels": ["Channel 1", "Channel 2"],
      "icp_details": {
        "role": "Their role or identity",
        "context": "Their current situation",
        "motivation": "What drives them to look for a solution"
      }
    }
  ],
  "campaigns": [
    {
      "avatar_name": "Must match an avatar name above",
      "angle": "The strategic angle for this campaign",
      "channel": "One specific social channel",
      "hook": "The opening line or hook — specific and ready to post",
      "content_type": "One of: text-post, thread, video-hook, video-script, image-prompt",
      "why_it_works": "One sentence on why this angle resonates with this avatar"
    }
  ],`;

  if (product.wants_ads) {
    prompt += `
  "ad_campaigns": [
    {
      "avatar_name": "Must match an avatar name above",
      "angle": "The ad angle",
      "platform": "One of: ${product.ad_platforms?.join(", ") ?? "Meta, Google"}",
      "ad_format": "One of: single-image, carousel, video",
      "hook": "The primary ad headline or hook",
      "strategy": "retargeting or cold-traffic",
      "why_it_works": "Why this ad will convert"
    }
  ],`;
  }

  if (product.has_website) {
    prompt += `
  "website_kit": {
    "landing_page": {
      "headline": "Main headline",
      "subheadline": "Supporting line",
      "benefits": [
        { "heading": "Benefit 1", "description": "Explanation" },
        { "heading": "Benefit 2", "description": "Explanation" },
        { "heading": "Benefit 3", "description": "Explanation" }
      ],
      "social_proof_section": "Suggested social proof copy",
      "cta_text": "CTA button text"
    },
    "welcome_emails": [
      { "subject": "Email 1 subject", "body": "Full email body" },
      { "subject": "Email 2 subject", "body": "Full email body" },
      { "subject": "Email 3 subject", "body": "Full email body" }
    ],
    "meta_description": "Under 160 characters",
    "taglines": ["Option 1", "Option 2", "Option 3"]
  },`;
  }

  prompt += `
  "positioning_summary": "A 2-3 sentence summary of the recommended positioning for this product"
}`;

  return prompt;
}
