export {
  resolveDrag,
  glowFromDrag,
  type SwipeDirection,
  type DragGlow,
} from "@repo/ui/swipe-gesture";

import type { SwipeDirection } from "@repo/ui/swipe-gesture";

export type SwipeExpectation = "reject" | "approve";

/** A swipe is correct when left==reject and right==approve. */
export function isCorrectSwipe(
  expected: SwipeExpectation,
  direction: SwipeDirection,
): boolean {
  return (expected === "reject" && direction === "left") ||
    (expected === "approve" && direction === "right");
}

/** Advance only on a correct swipe; clamp at `count` (the complete sentinel). */
export function nextGateIndex(i: number, correct: boolean, count: number): number {
  if (!correct) return i;
  return Math.min(i + 1, count);
}

export function isGateComplete(i: number, count: number): boolean {
  return i >= count;
}
