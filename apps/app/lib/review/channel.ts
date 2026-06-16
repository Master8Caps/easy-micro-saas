/** Map a content-piece `type` to a platform when the type encodes one. */
function channelFromType(type: string): string | null {
  if (type.startsWith("linkedin")) return "LinkedIn";
  if (type.startsWith("twitter")) return "Twitter";
  if (type.startsWith("facebook")) return "Facebook";
  return null;
}

/**
 * Resolve the platform for a content piece.
 * Precedence: campaign channel → metadata channel → derived from type → null.
 */
export function resolveChannel(
  type: string,
  campaignChannel?: string | null,
  metadataChannel?: string | null,
): string | null {
  const campaign = campaignChannel?.trim();
  if (campaign) return campaign;
  const meta = metadataChannel?.trim();
  if (meta) return meta;
  return channelFromType(type);
}
