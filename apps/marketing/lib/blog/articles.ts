import { blogSupabase } from "./supabase";
import type { ArticleCardData } from "@/components/blog/article-card";

/**
 * Fetch published blog articles, newest first.
 * @param limit Optional cap on how many to return (e.g. 3 for the home teaser).
 */
export async function fetchArticles(limit?: number): Promise<ArticleCardData[]> {
  let query = blogSupabase
    .from("blog_articles")
    .select(
      "slug, title, excerpt, author, reading_time, featured_image, published_at, category_slug",
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data: articles, error } = await query;

  if (error || !articles) {
    console.error("Blog article fetch error:", error);
    return [];
  }

  const { data: categories } = await blogSupabase
    .from("blog_categories")
    .select("slug, name");

  const catMap = new Map<string, string>();
  for (const c of categories ?? []) catMap.set(c.slug, c.name);

  return articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    author: a.author,
    reading_time: a.reading_time,
    featured_image: a.featured_image,
    published_at: a.published_at,
    category_slug: a.category_slug,
    category_name: a.category_slug ? catMap.get(a.category_slug) ?? null : null,
  }));
}
