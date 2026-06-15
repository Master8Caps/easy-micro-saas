import { describe, it, expect } from "vitest";
import { resolveDrag, glowFromDrag } from "./swipe-gesture";

describe("resolveDrag", () => {
  it("returns null below the threshold either way", () => {
    expect(resolveDrag(40, 100)).toBeNull();
    expect(resolveDrag(-40, 100)).toBeNull();
    expect(resolveDrag(0, 100)).toBeNull();
  });
  it("commits left past the negative threshold", () => {
    expect(resolveDrag(-100, 100)).toBe("left");
    expect(resolveDrag(-180, 100)).toBe("left");
  });
  it("commits right past the positive threshold", () => {
    expect(resolveDrag(100, 100)).toBe("right");
    expect(resolveDrag(180, 100)).toBe("right");
  });
});

describe("glowFromDrag", () => {
  it("has no glow at rest", () => {
    expect(glowFromDrag(0, 100)).toEqual({ side: null, opacity: 0 });
  });
  it("builds a left/right glow proportional to drag distance", () => {
    expect(glowFromDrag(-50, 100)).toEqual({ side: "left", opacity: 0.5 });
    expect(glowFromDrag(50, 100)).toEqual({ side: "right", opacity: 0.5 });
  });
  it("clamps opacity at 1 past the threshold", () => {
    expect(glowFromDrag(-200, 100)).toEqual({ side: "left", opacity: 1 });
    expect(glowFromDrag(200, 100)).toEqual({ side: "right", opacity: 1 });
  });
});
