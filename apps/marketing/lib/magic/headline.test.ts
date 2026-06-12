import { describe, it, expect } from "vitest";
import { deriveHeadline } from "./headline";

describe("deriveHeadline", () => {
  it("takes the first clause before sentence/clause punctuation", () => {
    expect(deriveHeadline("The quiet win: a calmer week, because the busywork ran itself. ✨")).toBe("The quiet win");
    expect(deriveHeadline("Your whole funnel — drafted while you sleep.")).toBe("Your whole funnel");
    expect(deriveHeadline("BUY NOW!!! 50% OFF EVERYTHING")).toBe("BUY NOW");
  });

  it("caps at six words", () => {
    expect(deriveHeadline("one two three four five six seven eight")).toBe("one two three four five six");
  });

  it("strips trailing emoji and punctuation", () => {
    expect(deriveHeadline("Ship faster 🚀")).toBe("Ship faster");
    expect(deriveHeadline("Grow your brand,")).toBe("Grow your brand");
  });

  it("returns empty string for empty input", () => {
    expect(deriveHeadline("")).toBe("");
    expect(deriveHeadline("   ")).toBe("");
  });
});
