import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ArticleCard, type ArticleCardData } from "@/components/blog/article-card";
import { blogSupabase } from "@/lib/blog/supabase";

export const metadata: Metadata = {
  title: "Blog — Easy Micro SaaS",
  description:
    "Go-to-market playbooks, positioning, launch strategies, and growth experiments — written for solo founders and indie hackers.",
};

export const revalidate = 60;

async function fetchArticles(): Promise<ArticleCardData[]> {
  const { data: articles, error } = await blogSupabase
    .from("blog_articles")
    .select(
      "slug, title, excerpt, author, reading_time, featured_image, published_at, category_slug",
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error || !articles) {
    console.error("Blog index fetch error:", error);
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

export default async function BlogIndexPage() {
  const articles = await fetchArticles();

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Header */}
        <section className="relative px-6 pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-500/[0.06] blur-[140px]" />
          </div>
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse-glow" />
              <span className="text-xs font-medium tracking-wide text-zinc-400">
                The Blog
              </span>
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              Go-to-market,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                decoded.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
              Playbooks, positioning, and growth experiments — written for
              founders who&apos;ve already shipped and want to find their first
              100 users.
            </p>
          </div>
        </section>

        {/* Article grid */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-6xl">
            {articles.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                <p className="text-zinc-400">
                  No posts yet — check back soon.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
