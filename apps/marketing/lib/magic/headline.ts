// Emoji + symbol ranges we never want in a headline.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/gu;

/**
 * Fallback headline for the post graphic when generation didn't supply one.
 * First clause of the caption, emoji stripped, capped at six words.
 */
export function deriveHeadline(caption: string): string {
  const firstClause = caption.split(/[.!?:\n—]/)[0] ?? "";
  const words = firstClause.replace(EMOJI, "").trim().split(/\s+/).filter(Boolean).slice(0, 6);
  return words.join(" ").replace(/[\s,;:–—-]+$/u, "").trim();
}
