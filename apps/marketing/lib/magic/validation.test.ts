import { describe, it, expect } from "vitest";
import { normaliseUrl, isValidEmail } from "./validation";

describe("normaliseUrl", () => {
  it("adds https:// when missing", () => {
    expect(normaliseUrl("example.com")).toBe("https://example.com/");
  });
  it("keeps an existing scheme", () => {
    expect(normaliseUrl("http://example.com")).toBe("http://example.com/");
  });
  it("trims whitespace", () => {
    expect(normaliseUrl("  example.com  ")).toBe("https://example.com/");
  });
  it("returns null for a host with no dot", () => {
    expect(normaliseUrl("localhost")).toBeNull();
  });
  it("returns null for empty input", () => {
    expect(normaliseUrl("")).toBeNull();
  });
});

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
  });
  it("rejects a missing domain", () => {
    expect(isValidEmail("a@b")).toBe(false);
  });
});
