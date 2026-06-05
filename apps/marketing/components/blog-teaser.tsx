import Link from "next/link";
import { AnimateOnScroll } from "./animate-on-scroll";
import { ArticleCard } from "./blog/article-card";
import { fetchArticles } from "@/lib/blog/articles";

// Copy kept as extractable strings so the calm/Scandinavian variant can swap
// tone without touching markup. See docs/native.md.
const copy = {
  eyebrow: "From the blog",
  heading: "Go-to-market, decoded.",
  accent: "decoded.",
  subheading:
    "Playbooks, positioning, and growth experiments for founders who've shipped and want their first 100 users.",
  viewAll: "View all posts",
};

export async function BlogTeaser() {
  const articles = await fetchArticles(3);

  // Nothing published yet — don't render an empty section.
  if (articles.length === 0) return null;

  return (
    <section className="relative px-6 py-24 md:py-32">
      {/* Subtle divider */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <AnimateOnScroll>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                {copy.eyebrow}
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Go-to-market,{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {copy.accent}
                </span>
              </h2>
              <p className="mt-4 max-w-lg text-zinc-400">{copy.subheading}</p>
            </div>

            <Link
              href="/blog"
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {copy.viewAll}
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </AnimateOnScroll>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <AnimateOnScroll key={article.slug} delay={i * 100}>
              <ArticleCard article={article} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
