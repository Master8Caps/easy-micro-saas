import { describe, it, expect } from "vitest";
import { nextIndex, prevIndex } from "./carousel";

describe("carousel navigation", () => {
  it("advances but clamps at the last index", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(2);
  });
  it("goes back but clamps at zero", () => {
    expect(prevIndex(2, 3)).toBe(1);
    expect(prevIndex(0, 3)).toBe(0);
  });
  it("handles an empty list safely", () => {
    expect(nextIndex(0, 0)).toBe(0);
    expect(prevIndex(0, 0)).toBe(0);
  });
});
