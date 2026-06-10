import { describe, it, expect } from "vitest";
import { buildImagePrompt, VISUAL_STYLES, VISUAL_STYLE_KEYS, DEFAULT_STYLE_KEY } from "./image-style";

describe("buildImagePrompt", () => {
  it("includes the chosen style direction, subject, brand colours and negative constraints", () => {
    const p = buildImagePrompt({
      styleKey: "editorial_product",
      brandColors: ["#0d9488", "#155e75"],
      subject: "a ceramic coffee cup on a linen surface",
    });
    expect(p).toContain(VISUAL_STYLES.editorial_product.direction);
    expect(p).toContain("a ceramic coffee cup on a linen surface");
    expect(p).toContain("#0d9488");
    expect(p.toLowerCase()).toContain("no text");
  });

  it("falls back to the default style for an unknown key", () => {
    const p = buildImagePrompt({ styleKey: "does-not-exist", subject: "x" });
    expect(p).toContain(VISUAL_STYLES[DEFAULT_STYLE_KEY].direction);
  });

  it("omits the colour clause when no colours are given", () => {
    const p = buildImagePrompt({ styleKey: "minimal_render", subject: "x" });
    expect(p).not.toContain("brand palette");
  });

  it("exposes the style keys for the generator to choose from", () => {
    expect(VISUAL_STYLE_KEYS).toEqual(Object.keys(VISUAL_STYLES));
    expect(VISUAL_STYLE_KEYS).toContain(DEFAULT_STYLE_KEY);
  });
});
