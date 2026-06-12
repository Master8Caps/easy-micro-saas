import { describe, it, expect } from "vitest";
import { platformTheme } from "./post-graphic-style";

describe("platformTheme", () => {
  it("gives Instagram a vibrant gradient square with supporting body text", () => {
    const t = platformTheme("Instagram");
    expect(t.treatment).toBe("gradient");
    expect(t.aspect).toBe(1);
    expect(t.emoji).toBe(true);
    expect(t.body).toBe(true);
    expect(t.bodyLines).toBeGreaterThan(0);
  });

  it("gives LinkedIn a restrained dark treatment with a subhead, body, and no emoji", () => {
    const t = platformTheme("LinkedIn");
    expect(t.treatment).toBe("darkAccent");
    expect(t.subhead).toBe(true);
    expect(t.emoji).toBe(false);
    expect(t.body).toBe(true);
  });

  it("keeps X/twitter punchy: solid landscape, no body text", () => {
    expect(platformTheme("X").treatment).toBe("solid");
    expect(platformTheme("twitter").treatment).toBe("solid");
    expect(platformTheme("X").aspect).toBeCloseTo(1.78);
    expect(platformTheme("X").body).toBe(false);
    expect(platformTheme("twitter").body).toBe(false);
  });

  it("falls back to the gradient default for unknown platforms", () => {
    expect(platformTheme("TikTok").treatment).toBe("gradient");
    expect(platformTheme("").treatment).toBe("gradient");
  });
});
