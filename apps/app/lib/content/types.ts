/** Social post types that can carry an image and appear in the swipe review deck. */
export const SOCIAL_POST_TYPES = [
  "linkedin-post",
  "twitter-post",
  "twitter-thread",
  "facebook-post",
  "instagram-post",
  "image-prompt",
] as const;

const SOCIAL_SET = new Set<string>(SOCIAL_POST_TYPES);

export function isSocialPostType(type: string): boolean {
  return SOCIAL_SET.has(type);
}

/**
 * Resolve a campaign's (content_type, channel) to a stored content_pieces.type.
 * Instagram posts become the dedicated instagram-post type (always-image);
 * Instagram videos stay video-script.
 */
export function mapContentType(contentType: string, channel: string): string {
  const key = contentType.toLowerCase();
  const ch = channel.toLowerCase();

  if (ch.includes("instagram")) {
    if (key === "video-script") return "video-script";
    return "instagram-post";
  }
  if (key === "text-post") {
    if (ch.includes("email")) return "email";
    if (ch.includes("linkedin")) return "linkedin-post";
    if (ch.includes("twitter") || ch.includes("x")) return "twitter-post";
    if (ch.includes("facebook")) return "facebook-post";
    return "linkedin-post";
  }
  if (key === "thread") return "twitter-thread";
  if (key === "video-script") return "video-script";
  if (key === "image-prompt") return "image-prompt";
  if (key === "landing-page") return "landing-page-copy";
  if (key === "email") return "email";
  if (key === "ad-copy") return "ad-copy";
  return "linkedin-post";
}

export type ImageState = "ready" | "pending" | "none";

/** ready = has image; pending = has a prompt but no image yet; none = neither. */
export function imageState(
  imagePromptUsed: string | null,
  imageUrl: string | null,
): ImageState {
  if (imageUrl) return "ready";
  if (imagePromptUsed && imagePromptUsed.trim()) return "pending";
  return "none";
}
