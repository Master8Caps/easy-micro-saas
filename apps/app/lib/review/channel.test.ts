import { describe, it, expect } from "vitest";
import { resolveChannel } from "./channel";

describe("resolveChannel", () => {
  it("prefers the campaign channel", () => {
    expect(resolveChannel("facebook-post", "LinkedIn", "twitter")).toBe("LinkedIn");
  });
  it("falls back to metadata channel when no campaign channel", () => {
    expect(resolveChannel("email", null, "Instagram")).toBe("Instagram");
  });
  it("derives from the type prefix as a last resort", () => {
    expect(resolveChannel("linkedin-post", null, undefined)).toBe("LinkedIn");
    expect(resolveChannel("twitter-thread", null, null)).toBe("Twitter");
    expect(resolveChannel("facebook-post", null, null)).toBe("Facebook");
  });
  it("returns null when nothing resolves", () => {
    expect(resolveChannel("tagline", null, null)).toBeNull();
    expect(resolveChannel("email", null, "  ")).toBeNull();
  });
});
