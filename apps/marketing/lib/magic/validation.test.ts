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

describe("normaliseUrl SSRF blocking", () => {
  const blocked = [
    "http://127.0.0.1",
    "http://10.0.0.1",
    "http://192.168.1.1",
    "http://172.16.0.1",
    "http://169.254.169.254",
    "http://0.0.0.0",
    "http://0x7f000001",      // hex -> 127.0.0.1
    "http://2130706433",       // decimal -> 127.0.0.1
    "http://metadata.google.internal",
    "http://[::1]",
  ];
  for (const u of blocked) {
    it(`rejects ${u}`, () => {
      expect(normaliseUrl(u)).toBeNull();
    });
  }
  it("still allows a normal public domain", () => {
    expect(normaliseUrl("example.com")).toBe("https://example.com/");
    expect(normaliseUrl("https://www.stripe.com")).toBe("https://www.stripe.com/");
  });
});
