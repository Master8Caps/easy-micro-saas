import Anthropic from "@anthropic-ai/sdk";
import type { BrandSignals, MagicResult } from "./types";

const MODEL = process.env.MAGIC_MODEL ?? "claude-sonnet-4-6";

export function buildMagicPrompt(
  signals: BrandSignals,
  description?: string,
): string {
  return `You are a brand strategist. From the website signals below, infer the brand identity and produce a short, punchy marketing teaser.

WEBSITE SIGNALS
- URL: ${signals.url}
- Title: ${signals.title}
- Description: ${signals.description}
- Headings: ${signals.headings.join(" | ")}
- Body excerpt: ${signals.text}
${signals.themeColor ? `- Theme colour: ${signals.themeColor}` : ""}
${description ? `- Owner's one-line description: ${description}` : ""}

INSTRUCTIONS
1. Infer the brand: name, a short tagline, 2-3 tone-of-voice adjectives, and a palette of 2-4 hex colours that fit the brand (use the theme colour if given, otherwise infer tasteful colours).
2. Write a one-sentence positioning summary.
3. Create 2-3 specific customer avatars: name, role, 2-3 pain points, 2 channels each.
4. Write 3 sample social posts in the brand's tone: platform, caption, 2-3 hashtags, and realistic engagement numbers (likes/comments/shares).

Respond with ONLY valid JSON in exactly this shape:
{
  "brand": { "name": "", "tagline": "", "tone": ["",""], "palette": ["#hex"], "positioning": "" },
  "avatars": [ { "name": "", "role": "", "painPoints": ["",""], "channels": ["",""] } ],
  "samplePosts": [ { "platform": "", "caption": "", "hashtags": ["#tag"], "engagement": { "likes": 0, "comments": 0, "shares": 0 } } ]
}`;
}

function normaliseResult(raw: MagicResult, signals: BrandSignals): MagicResult {
  return {
    brand: {
      name: raw.brand?.name || signals.title || "Your brand",
      tagline: raw.brand?.tagline || "",
      tone: raw.brand?.tone?.length ? raw.brand.tone : ["confident"],
      palette: raw.brand?.palette?.length
        ? raw.brand.palette
        : [signals.themeColor || "#6366f1", "#a78bfa"],
      logoUrl: raw.brand?.logoUrl || signals.ogImage || signals.favicon,
      positioning: raw.brand?.positioning || "",
    },
    avatars: Array.isArray(raw.avatars) ? raw.avatars : [],
    samplePosts: Array.isArray(raw.samplePosts) ? raw.samplePosts : [],
  };
}

export async function generateMagicResult(
  signals: BrandSignals,
  description?: string,
  client: Anthropic = new Anthropic(),
): Promise<MagicResult> {
  const prompt = buildMagicPrompt(signals, description);
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content.find((b) => b.type === "text");
      if (!block || block.type !== "text") throw new Error("No text response");
      const match = block.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      const parsed = JSON.parse(match[0]) as MagicResult;
      return normaliseResult(parsed, signals);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Generation failed");
}
