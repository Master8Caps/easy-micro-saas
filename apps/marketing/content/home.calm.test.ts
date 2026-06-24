import { describe, it, expect } from "vitest";
import { calmHome } from "./home.calm";

describe("calmHome copy", () => {
  it("hero headline is the Taiga tagline", () => {
    expect(calmHome.hero.headline).toBe("Grow your business. Stay calm.");
  });
  it("pricing shows the £49.95 plan", () => {
    expect(calmHome.pricing.price).toBe("£49.95");
  });
  it("breadth lists the five channels", () => {
    expect(calmHome.breadth.items).toHaveLength(5);
  });
});
