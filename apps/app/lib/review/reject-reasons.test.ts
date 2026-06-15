import { describe, it, expect } from "vitest";
import { REJECT_REASONS, isRejectReason } from "./reject-reasons";

describe("reject reasons", () => {
  it("exposes a non-empty list with unique slugs", () => {
    const slugs = REJECT_REASONS.map((r) => r.slug);
    expect(slugs.length).toBeGreaterThan(0);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("validates known and unknown slugs", () => {
    expect(isRejectReason("too_salesy")).toBe(true);
    expect(isRejectReason("nonsense")).toBe(false);
    expect(isRejectReason(null)).toBe(false);
  });
});
