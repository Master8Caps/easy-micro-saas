import { describe, it, expect } from "vitest";
import { summarizeRejectReasons } from "./summarize-reject-reasons";

describe("summarizeRejectReasons", () => {
  it("counts and orders reasons by frequency, labelled", () => {
    const rows = [
      { reject_reason: "too_salesy" },
      { reject_reason: "too_salesy" },
      { reject_reason: "boring" },
      { reject_reason: null },
      { reject_reason: "unknown_slug" },
    ];
    expect(summarizeRejectReasons(rows)).toEqual([
      { label: "Too salesy", count: 2 },
      { label: "Boring", count: 1 },
    ]);
  });
  it("returns an empty array when there are no valid reasons", () => {
    expect(summarizeRejectReasons([{ reject_reason: null }])).toEqual([]);
  });
});
