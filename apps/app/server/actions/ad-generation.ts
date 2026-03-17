"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/adapters";
import type { Platform, AdObjective } from "@/lib/adapters/types";

const anthropic = new Anthropic();

export interface GenerateAdInput {
  productId: string;
  platform: Platform;
  objective: AdObjective;
  campaignName: string;
  dailyBudget: number;
  destinationUrl: string;
  additionalContext?: string;
}

export async function generateAdPackage(input: GenerateAdInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", input.productId)
    .single();

  if (!product) return { error: "Product not found" };

  const { data: avatars } = await supabase
    .from("avatars")
    .select("name, description, pain_points, channels, icp_details")
    .eq("product_id", input.productId)
    .eq("is_active", true);

  const { data: topContent } = await supabase
    .from("content_pieces")
    .select("title, body, type, rating")
    .eq("product_id", input.productId)
    .eq("type", "ad-copy")
    .eq("rating", 1)
    .limit(5);

  const adapter = getAdapter(input.platform);
  const specs = adapter.getCreativeSpecs();

  const prompt = `You are an expert media buyer and ad copywriter. Generate a high-converting ad for the following product and platform.

PRODUCT:
Name: ${product.name}
Description: ${product.description}
${product.market ? `Market: ${product.market}` : ""}
${product.goals ? `Goals: ${product.goals}` : ""}

TARGET AUDIENCES:
${
  avatars?.map((a: { name: string; description: string; pain_points?: string }) => `- ${a.name}: ${a.description}${a.pain_points ? ` | Pain points: ${a.pain_points}` : ""}`).join("\n") ?? "No avatars defined yet"
}

PLATFORM: ${input.platform}
OBJECTIVE: ${input.objective}
BUDGET: $${input.dailyBudget}/day

PLATFORM CONSTRAINTS:
- Headline max: ${specs.headlineMaxLength} chars
- Body max: ${specs.bodyMaxLength} chars
- Available CTAs: ${specs.ctaOptions.join(", ")}
- Image formats: ${specs.imageFormats.map((f) => `${f.name} (${f.width}x${f.height})`).join(", ")}

${topContent && topContent.length > 0 ? `PAST WINNING AD COPY (rated positively by user):\n${topContent.map((c: { title: string; body?: string }) => `- ${c.title}: ${c.body?.substring(0, 100)}`).join("\n")}` : ""}

${input.additionalContext ? `ADDITIONAL CONTEXT: ${input.additionalContext}` : ""}

Generate exactly 3 ad variations. For each, provide:
1. headline (within character limit)
2. body (within character limit)
3. cta (from available options)
4. targetingNotes (audience targeting suggestions specific to this platform)
5. imagePrompt (a prompt to generate an ad image)

Respond in JSON format:
{
  "ads": [
    {
      "headline": "...",
      "body": "...",
      "cta": "...",
      "targetingNotes": "...",
      "imagePrompt": "..."
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { error: "Failed to parse AI response" };

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      ads: Array<{
        headline: string;
        body: string;
        cta: string;
        targetingNotes: string;
        imagePrompt: string;
      }>;
    };

    const packages = parsed.ads.map((ad) => {
      const adInput = {
        headline: ad.headline,
        body: ad.body,
        cta: ad.cta,
        imageUrl: undefined,
        destinationUrl: input.destinationUrl,
        audienceTargeting: {},
        dailyBudget: input.dailyBudget,
        objective: input.objective,
        campaignName: input.campaignName,
      };

      const validation = adapter.validateCreative(adInput);
      const pkg = adapter.generatePackage(adInput);

      return {
        ...pkg,
        targetingNotes: ad.targetingNotes,
        imagePrompt: ad.imagePrompt,
        validation,
      };
    });

    return { packages };
  } catch {
    return { error: "Failed to parse generated ads" };
  }
}
