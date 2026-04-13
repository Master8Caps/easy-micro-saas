import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ArticleCard, type ArticleCardData } from "@/components/blog/article-card";
import { blogSupabase } from "@/lib/blog/supabase";

export const revalidate = 60;

async function fetchCategory(
  slug: string,
): Promise<{ slug: string; name: string } | null> {
  const { data } = await blogSupabase
    .from("blog_categories")
    .select("slug, name")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

async function fetchCategoryArticles(
  categorySlug: string,
  categoryName: string,
): Promise<ArticleCardData[]> {
  const { data, error } = await blogSupabase
    .from("blog_articles")
    .select(
      "slug, title, excerpt, author, reading_time, featured_image, published_at, category_slug",
    )
    .eq("published", true)
    .eq("category_slug", categorySlug)
    .order("published_at", { ascending: false });

  if (error || !data) return [];

  return data.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    author: a.author,
    reading_time: a.reading_time,
    featured_image: a.featured_image,
    published_at: a.published_at,
    category_slug: a.category_slug,
    category_name: categoryName,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) return { title: "Not found — Easy Micro SaaS" };

  return {
    title: `${category.name} — Easy Micro SaaS Blog`,
    description: `Posts about ${category.name.toLowerCase()} for solo founders and indie hackers.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) notFound();

  const articles = await fetchCategoryArticles(category.slug, category.name);

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <section className="relative px-6 pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-500/[0.05] blur-[140px]" />
          </div>
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <span>&larr;</span> All posts
              </Link>
            </div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5">
              <span className="text-xs font-medium tracking-wide text-indigo-300">
                Category
              </span>
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              {category.name}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
              {articles.length} {articles.length === 1 ? "post" : "posts"} in
              this category
            </p>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-6xl">
            {articles.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                <p className="text-zinc-400">No posts in this category yet.</p>
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
