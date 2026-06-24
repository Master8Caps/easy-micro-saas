import Link from "next/link";
import { calmHome } from "@/content/home.calm";
import { fetchArticles } from "@/lib/blog/articles";
import { ArticleCard } from "@/components/blog/article-card";

export async function CalmBlog() {
  const articles = await fetchArticles(3);
  if (articles.length === 0) return null;

  return (
    <section className="bg-birch/10 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="font-heading text-2xl text-ink">{calmHome.blog.eyebrow}</h2>
          <Link href="/blog" className="text-sm text-accent hover:opacity-80">
            {calmHome.blog.viewAll} →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
