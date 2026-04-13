import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/blog/auth";
import { blogSupabase } from "@/lib/blog/supabase";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  // Seeded vocabulary baseline
  const { data: seedRows, error: seedErr } = await blogSupabase
    .from("blog_tags")
    .select("slug");

  if (seedErr) {
    console.error("Blog metadata tags (seed) error:", seedErr);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // Distinct tags actually used across published articles
  const { data: articleRows, error: articleErr } = await blogSupabase
    .from("blog_articles")
    .select("tags")
    .eq("published", true);

  if (articleErr) {
    console.error("Blog metadata tags (articles) error:", articleErr);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  const tagSet = new Set<string>();
  for (const row of seedRows ?? []) tagSet.add(row.slug);
  for (const row of articleRows ?? []) {
    for (const t of (row.tags as string[] | null) ?? []) tagSet.add(t);
  }

  return NextResponse.json({ tags: Array.from(tagSet).sort() });
}
