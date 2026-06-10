import { describe, it, expect } from "vitest";
import { JOURNEY_SAMPLE_POSTS } from "./journey-cards";

describe("JOURNEY_SAMPLE_POSTS", () => {
  it("provides a few complete branded sample posts", () => {
    expect(JOURNEY_SAMPLE_POSTS.length).toBeGreaterThanOrEqual(3);
    for (const p of JOURNEY_SAMPLE_POSTS) {
      expect(p.platform).toBeTruthy();
      expect(p.caption).toBeTruthy();
      expect(p.gradient).toMatch(/^linear-gradient/);
    }
  });
});
