import { describe, it, expect } from "vitest";
import {
  isCorrectSwipe,
  nextGateIndex,
  isGateComplete,
  resolveDrag,
  glowFromDrag,
} from "./swipe-gate";

describe("swipe gate", () => {
  it("accepts the correct direction for each example", () => {
    expect(isCorrectSwipe("reject", "left")).toBe(true);
    expect(isCorrectSwipe("reject", "right")).toBe(false);
    expect(isCorrectSwipe("approve", "right")).toBe(true);
    expect(isCorrectSwipe("approve", "left")).toBe(false);
  });

  it("advances only on a correct swipe and clamps at the end", () => {
    expect(nextGateIndex(0, true, 2)).toBe(1);
    expect(nextGateIndex(0, false, 2)).toBe(0);
    expect(nextGateIndex(1, true, 2)).toBe(2);
  });

  it("reports completion when index reaches the count", () => {
    expect(isGateComplete(2, 2)).toBe(true);
    expect(isGateComplete(1, 2)).toBe(false);
  });
});

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
