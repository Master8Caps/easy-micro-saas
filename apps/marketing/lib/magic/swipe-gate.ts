export type SwipeDirection = "left" | "right";
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

/**
 * Decide whether a horizontal drag offset `dx` (px) is a committed swipe.
 * Returns the direction once |dx| reaches `threshold`, else null (snap back).
 */
export function resolveDrag(dx: number, threshold: number): SwipeDirection | null {
  if (dx <= -threshold) return "left";
  if (dx >= threshold) return "right";
  return null;
}

export interface DragGlow {
  side: SwipeDirection | null;
  /** 0..1, scales with how far the card is dragged toward `threshold`. */
  opacity: number;
}

/** Tinder-style colour overlay strength from the current drag offset. */
export function glowFromDrag(dx: number, threshold: number): DragGlow {
  if (dx === 0 || threshold <= 0) return { side: null, opacity: 0 };
  const opacity = Math.min(Math.abs(dx) / threshold, 1);
  return { side: dx < 0 ? "left" : "right", opacity };
}
