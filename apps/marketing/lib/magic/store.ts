import { createClient } from "@supabase/supabase-js";
import type { MagicResult } from "./types";
import { RESULT_VERSION, isCurrentResultVersion } from "./result-version";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DEDUPE_WINDOW_HOURS = 24;

export async function createLead(
  sourceUrl: string,
  result: MagicResult,
): Promise<string | null> {
  const versioned: MagicResult = { ...result, version: RESULT_VERSION };
  const { data, error } = await supabase
    .from("magic_leads")
    .insert({ source_url: sourceUrl, result: versioned })
    .select("id")
    .single();
  if (error || !data) {
    console.error("createLead error:", error);
    return null;
  }
  return data.id as string;
}

export async function attachEmail(id: string, email: string): Promise<boolean> {
  const { error } = await supabase
    .from("magic_leads")
    .update({ email: email.toLowerCase().trim() })
    .eq("id", id);
  if (error) console.error("attachEmail error:", error);
  return !error;
}

export async function getLead(
  id: string,
): Promise<{ sourceUrl: string; result: MagicResult } | null> {
  const { data, error } = await supabase
    .from("magic_leads")
    .select("source_url, result")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return { sourceUrl: data.source_url, result: data.result as MagicResult };
}

export async function findRecentResultByUrl(
  url: string,
): Promise<MagicResult | null> {
  const since = new Date(
    Date.now() - DEDUPE_WINDOW_HOURS * 3600_000,
  ).toISOString();
  const { data } = await supabase
    .from("magic_leads")
    .select("result")
    .eq("source_url", url)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const result = data.result as MagicResult;
  return isCurrentResultVersion(result) ? result : null;
}
