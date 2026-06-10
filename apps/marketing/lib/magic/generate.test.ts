import { describe, it, expect, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { generateMagicResult } from "./generate";
import type { BrandSignals } from "./types";
import { VISUAL_STYLE_KEYS } from "./image-style";

const SIGNALS: BrandSignals = {
  url: "https://northwind.com",
  title: "Northwind",
  description: "Reclaim your weekends.",
  ogImage: "https://northwind.com/og-banner.png",
  logoUrl: "https://northwind.com/logo.png",
  themeColor: "#10b981",
  palette: ["#10b981", "#0f766e"],
  headings: ["Work less, live more"],
  text: "Northwind automates the boring parts.",
  thin: false,
};

const VALID_JSON = JSON.stringify({
  brand: {
    name: "Northwind",
    tagline: "Reclaim your weekends",
    tone: ["calm", "friendly"],
    palette: ["#10b981", "#34d399"],
    positioning: "Automation for busy founders.",
    visualStyle: "minimal_render",
  },
  avatars: [
    { name: "Maya", role: "Solo founder", painPoints: ["No time"], channels: ["Instagram"] },
  ],
  samplePosts: [
    { platform: "Instagram", caption: "Reclaim your weekends.", hashtags: ["#worklife"], engagement: { likes: 200, comments: 12, shares: 5 }, imagePrompt: "a calm tidy desk at golden hour" },
  ],
});

function mockClient(text: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({ content: [{ type: "text", text }] }),
    },
  } as unknown as Anthropic;
}

describe("generateMagicResult", () => {
  it("parses valid JSON and fills logoUrl from the real logo (not og:image)", async () => {
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(VALID_JSON));
    expect(result.brand.name).toBe("Northwind");
    expect(result.brand.logoUrl).toBe("https://northwind.com/logo.png");
    expect(result.brand.logoUrl).not.toBe(SIGNALS.ogImage);
    expect(result.avatars).toHaveLength(1);
    expect(result.samplePosts[0].platform).toBe("Instagram");
  });

  it("prefers the extracted palette over the model's invented colours", async () => {
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(VALID_JSON));
    expect(result.brand.palette).toEqual(["#10b981", "#0f766e"]);
  });

  it("extracts JSON even with surrounding prose", async () => {
    const result = await generateMagicResult(
      SIGNALS,
      undefined,
      mockClient("Here you go:\n" + VALID_JSON + "\nHope that helps!"),
    );
    expect(result.brand.tone).toEqual(["calm", "friendly"]);
  });

  it("retries once then throws on persistent bad output", async () => {
    const client = {
      messages: { create: vi.fn().mockResolvedValue({ content: [{ type: "text", text: "no json here" }] }) },
    } as unknown as Anthropic;
    await expect(generateMagicResult(SIGNALS, undefined, client)).rejects.toThrow();
    expect((client.messages.create as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
  });

  it("carries visualStyle and per-post imagePrompt through", async () => {
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(VALID_JSON));
    expect(result.brand.visualStyle).toBe("minimal_render");
    expect(result.samplePosts[0].imagePrompt).toBe("a calm tidy desk at golden hour");
  });

  it("falls back to a valid default style when the model omits/invents one", async () => {
    const bad = JSON.parse(VALID_JSON);
    bad.brand.visualStyle = "not_a_real_style";
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(JSON.stringify(bad)));
    expect(VISUAL_STYLE_KEYS).toContain(result.brand.visualStyle);
  });
});
