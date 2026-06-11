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
): Promise<{ sourceUrl: string; result: MagicResult; email: string | null } | null> {
  const { data, error } = await supabase
    .from("magic_leads")
    .select("source_url, result, email")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    sourceUrl: data.source_url,
    result: data.result as MagicResult,
    email: (data.email as string | null) ?? null,
  };
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

const IMAGE_BUCKET = "magic-images";

/** Upload a base64 PNG for a post; returns the public URL, or null on failure. */
export async function uploadPostImage(
  leadId: string,
  index: number,
  base64: string,
): Promise<string | null> {
  try {
    const buffer = Buffer.from(base64, "base64");
    const path = `${leadId}/${index}.png`;
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, buffer, { contentType: "image/png", upsert: true });
    if (error) {
      console.error("uploadPostImage error:", error);
      return null;
    }
    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?v=${index}`;
  } catch (err) {
    console.error("uploadPostImage threw:", err);
    return null;
  }
}

/** Persist a generated image URL onto a stored result's sample post. */
export async function setPostImageUrl(
  id: string,
  index: number,
  url: string,
): Promise<void> {
  const lead = await getLead(id);
  if (!lead) return;
  const posts = lead.result.samplePosts ?? [];
  if (!posts[index]) return;
  posts[index] = { ...posts[index], imageUrl: url };
  const { error } = await supabase
    .from("magic_leads")
    .update({ result: { ...lead.result, samplePosts: posts } })
    .eq("id", id);
  if (error) console.error("setPostImageUrl error:", error);
}
