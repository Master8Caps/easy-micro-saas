import { describe, it, expect } from "vitest";
import { isCorrectSwipe, nextGateIndex, isGateComplete } from "./swipe-gate";

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
