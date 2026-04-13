import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/blog/auth";
import { blogSupabase, SITE_ORIGIN } from "@/lib/blog/supabase";

type PublishBody = {
  slug?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  author?: string;
  readingTime?: number;
  featuredImage?: string;
  tags?: string;
  published?: boolean;
  publishedAt?: string;
};

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

export async function POST(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  let body: PublishBody;
  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { slug, title, content } = body;
  if (!slug || typeof slug !== "string") {
    return NextResponse.json(
      { error: "Missing required field: slug" },
      { status: 400 },
    );
  }
  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "Missing required field: title" },
      { status: 400 },
    );
  }
  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Missing required field: content" },
      { status: 400 },
    );
  }

  // Validate category if supplied.
  if (body.category) {
    const { data: cat } = await blogSupabase
      .from("blog_categories")
      .select("slug")
      .eq("slug", body.category)
      .maybeSingle();

    if (!cat) {
      const { data: allCats } = await blogSupabase
        .from("blog_categories")
        .select("slug")
        .order("slug");

      return NextResponse.json(
        {
          error: "Invalid category",
          valid: (allCats ?? []).map((c) => c.slug),
        },
        { status: 409 },
      );
    }
  }

  // Does the article already exist?
  const { data: existing } = await blogSupabase
    .from("blog_articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const row = {
    slug,
    title,
    content,
    excerpt: body.excerpt ?? null,
    category_slug: body.category ?? null,
    author: body.author ?? "Easy Micro SaaS Team",
    reading_time:
      typeof body.readingTime === "number" ? body.readingTime : null,
    featured_image: body.featuredImage ?? null,
    tags: parseTags(body.tags),
    published: body.published ?? true,
    published_at: body.publishedAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await blogSupabase
      .from("blog_articles")
      .update(row)
      .eq("slug", slug);

    if (error) {
      console.error("Blog upsert (update) error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      slug,
      publishedUrl: `${SITE_ORIGIN}/blog/${slug}`,
      created: false,
    });
  }

  const { error } = await blogSupabase.from("blog_articles").insert(row);

  if (error) {
    console.error("Blog upsert (insert) error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    slug,
    publishedUrl: `${SITE_ORIGIN}/blog/${slug}`,
    created: true,
  });
}
