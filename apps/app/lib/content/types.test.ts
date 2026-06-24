import { describe, it, expect } from "vitest";
import { mapContentType, isSocialPostType, imageState, SOCIAL_POST_TYPES } from "./types";

describe("mapContentType", () => {
  it("maps Instagram posts to instagram-post (text or image)", () => {
    expect(mapContentType("text-post", "Instagram")).toBe("instagram-post");
    expect(mapContentType("image-prompt", "Instagram")).toBe("instagram-post");
  });
  it("keeps Instagram video as video-script", () => {
    expect(mapContentType("video-script", "Instagram")).toBe("video-script");
  });
  it("maps other channels' text posts to their native type", () => {
    expect(mapContentType("text-post", "LinkedIn")).toBe("linkedin-post");
    expect(mapContentType("text-post", "Facebook")).toBe("facebook-post");
    expect(mapContentType("text-post", "X / Twitter")).toBe("twitter-post");
    expect(mapContentType("thread", "X")).toBe("twitter-thread");
  });
});

describe("isSocialPostType", () => {
  it("recognises social post types", () => {
    expect(isSocialPostType("instagram-post")).toBe(true);
    expect(isSocialPostType("facebook-post")).toBe(true);
    expect(isSocialPostType("image-prompt")).toBe(true);
    expect(isSocialPostType("email")).toBe(false);
    expect(isSocialPostType("tagline")).toBe(false);
  });
});

describe("imageState", () => {
  it("is ready when an image url exists", () => {
    expect(imageState("a prompt", "http://x/y.png")).toBe("ready");
    expect(imageState(null, "http://x/y.png")).toBe("ready");
  });
  it("is pending when only a prompt exists", () => {
    expect(imageState("a prompt", null)).toBe("pending");
  });
  it("is none when neither exists", () => {
    expect(imageState(null, null)).toBe("none");
    expect(imageState("", null)).toBe("none");
  });
});

describe("SOCIAL_POST_TYPES", () => {
  it("has unique entries and includes instagram-post", () => {
    expect(SOCIAL_POST_TYPES).toContain("instagram-post");
    expect(new Set(SOCIAL_POST_TYPES).size).toBe(SOCIAL_POST_TYPES.length);
  });
});
