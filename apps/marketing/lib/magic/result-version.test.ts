import { describe, it, expect } from "vitest";
import { isCurrentResultVersion, RESULT_VERSION } from "./result-version";

describe("isCurrentResultVersion", () => {
  it("accepts a result stamped with the current version", () => {
    expect(isCurrentResultVersion({ version: RESULT_VERSION })).toBe(true);
  });
  it("rejects an unversioned (pre-redesign) result", () => {
    expect(isCurrentResultVersion({})).toBe(false);
    expect(isCurrentResultVersion({ version: undefined })).toBe(false);
  });
  it("rejects a result from an older version", () => {
    expect(isCurrentResultVersion({ version: 1 })).toBe(false);
  });
  it("is at version 3 (headline added to sample posts)", () => {
    expect(RESULT_VERSION).toBe(3);
  });
});
