import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/blog/auth";
import { blogSupabase, SITE_ORIGIN } from "@/lib/blog/supabase";

const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 200;

function parseIntParam(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseIntParam(searchParams.get("page"), 1));
  const perPageRaw = parseIntParam(
    searchParams.get("perPage"),
    DEFAULT_PER_PAGE,
  );
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, perPageRaw));

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count, error } = await blogSupabase
    .from("blog_articles")
    .select(
      "id, slug, title, excerpt, category_slug, tags, published_at",
      { count: "exact" },
    )
    .eq("published", true)
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Blog posts list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  const posts = (data ?? []).map((a) => ({
    id: String(a.id),
    slug: a.slug,
    title: a.title,
    url: `${SITE_ORIGIN}/blog/${a.slug}`,
    excerpt: a.excerpt ?? "",
    category: a.category_slug ?? "",
    tags: Array.isArray(a.tags) ? (a.tags as string[]).join(",") : "",
    publishedAt: a.published_at,
  }));

  return NextResponse.json({
    posts,
    total: count ?? 0,
    page,
    perPage,
  });
}
