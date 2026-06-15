import { isRejectReason, rejectReasonLabel } from "./reject-reasons";

export interface RejectReasonRow {
  reject_reason: string | null;
}

export interface RejectReasonSummary {
  label: string;
  count: number;
}

/** Count valid reject reasons, most frequent first, mapped to display labels. */
export function summarizeRejectReasons(rows: RejectReasonRow[]): RejectReasonSummary[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!isRejectReason(row.reject_reason)) continue;
    counts.set(row.reject_reason, (counts.get(row.reject_reason) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([slug, count]) => ({ label: rejectReasonLabel(slug), count }));
}
