import type { SupabaseClient } from "@supabase/supabase-js";
import { summarizeRejectReasons } from "./summarize-reject-reasons";

/**
 * A one-line "avoid these" prompt fragment built from a product's recent
 * rejected drafts. Empty string when there are no reasons to report.
 * Runs its own query because the learning loader excludes archived pieces,
 * and rejected drafts are archived.
 */
export async function loadRejectReasonLine(
  supabase: SupabaseClient,
  productId: string,
): Promise<string> {
  const { data } = await supabase
    .from("content_pieces")
    .select("reject_reason")
    .eq("product_id", productId)
    .eq("archived", true)
    .not("reject_reason", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const summary = summarizeRejectReasons(
    (data as { reject_reason: string | null }[]) ?? [],
  );
  if (summary.length === 0) return "";
  const top = summary.slice(0, 3).map((s) => s.label.toLowerCase()).join(", ");
  return `\n\nRecent drafts were rejected mostly for being: ${top}. Avoid these.`;
}
