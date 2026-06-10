import { describe, it, expect, vi } from "vitest";
import type OpenAI from "openai";
import { generateImageBase64 } from "./images";

function mockClient(b64: string | null) {
  return {
    images: {
      generate: vi.fn().mockResolvedValue({ data: b64 ? [{ b64_json: b64 }] : [] }),
    },
  } as unknown as OpenAI;
}

describe("generateImageBase64", () => {
  it("returns the base64 image from gpt-image-1", async () => {
    const out = await generateImageBase64("a tidy desk", mockClient("AAAA"));
    expect(out).toBe("AAAA");
  });

  it("returns null when the API yields no image", async () => {
    expect(await generateImageBase64("x", mockClient(null))).toBeNull();
  });

  it("returns null (never throws) when the API errors", async () => {
    const client = { images: { generate: vi.fn().mockRejectedValue(new Error("boom")) } } as unknown as OpenAI;
    expect(await generateImageBase64("x", client)).toBeNull();
  });

  it("requests gpt-image-1 at high quality, square", async () => {
    const client = mockClient("AAAA");
    await generateImageBase64("a tidy desk", client);
    const call = (client.images.generate as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.model).toBe("gpt-image-1");
    expect(call.quality).toBe("high");
    expect(call.size).toBe("1024x1024");
  });
});
