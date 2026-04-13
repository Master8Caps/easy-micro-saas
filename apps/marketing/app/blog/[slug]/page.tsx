import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CategoryChip } from "@/components/blog/category-chip";
import { TagChip } from "@/components/blog/tag-chip";
import { blogSupabase, SITE_ORIGIN } from "@/lib/blog/supabase";

export const revalidate = 60;

type Article = {
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  author: string;
  reading_time: number | null;
  featured_image: string | null;
  published_at: string;
  category_slug: string | null;
  tags: string[];
};

async function fetchArticle(slug: string): Promise<Article | null> {
  const { data, error } = await blogSupabase
    .from("blog_articles")
    .select(
      "slug, title, content, excerpt, author, reading_time, featured_image, published_at, category_slug, tags",
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Article;
}

async function fetchCategoryName(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const { data } = await blogSupabase
    .from("blog_categories")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  return data?.name ?? null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: "Not found — Easy Micro SaaS" };
  }

  const description = article.excerpt ?? undefined;
  const url = `${SITE_ORIGIN}/blog/${article.slug}`;

  return {
    title: `${article.title} — Easy Micro SaaS`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url,
      publishedTime: article.published_at,
      authors: [article.author],
      images: article.featured_image
        ? [{ url: article.featured_image }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: article.featured_image ? [article.featured_image] : undefined,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const categoryName = await fetchCategoryName(article.category_slug);

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <article className="relative px-6 pt-32 pb-16 md:pt-40">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-500/[0.05] blur-[140px]" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <div className="mb-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <span>&larr;</span> Back to blog
              </Link>
            </div>

            {article.category_slug && categoryName && (
              <div className="mb-5">
                <CategoryChip
                  slug={article.category_slug}
                  name={categoryName}
                />
              </div>
            )}

            <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mt-5 text-lg leading-relaxed text-zinc-400">
                {article.excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span className="font-medium text-zinc-300">
                {article.author}
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-700" />
              <span>{formatDate(article.published_at)}</span>
              {article.reading_time ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-700" />
                  <span>{article.reading_time} min read</span>
                </>
              ) : null}
            </div>

            {article.featured_image && (
              <div className="mt-10 overflow-hidden rounded-xl border border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="h-auto w-full"
                />
              </div>
            )}

            <div
              className="blog-content mt-12 text-[1.0625rem] leading-[1.75] text-zinc-300"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {article.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-2 border-t border-white/[0.06] pt-8">
                {article.tags.map((tag) => (
                  <TagChip key={tag} slug={tag} />
                ))}
              </div>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
