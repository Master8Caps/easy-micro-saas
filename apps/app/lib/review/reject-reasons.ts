export const REJECT_REASONS = [
  { slug: "off_brand", label: "Off-brand" },
  { slug: "too_salesy", label: "Too salesy" },
  { slug: "boring", label: "Boring" },
  { slug: "wrong_offer", label: "Wrong offer" },
  { slug: "bad_image", label: "Bad image" },
] as const;

export type RejectReason = (typeof REJECT_REASONS)[number]["slug"];

const SLUGS = new Set(REJECT_REASONS.map((r) => r.slug));

export function isRejectReason(value: unknown): value is RejectReason {
  return typeof value === "string" && SLUGS.has(value as RejectReason);
}

export function rejectReasonLabel(slug: string): string {
  return REJECT_REASONS.find((r) => r.slug === slug)?.label ?? slug;
}
