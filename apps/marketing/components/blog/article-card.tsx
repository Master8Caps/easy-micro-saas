import Link from "next/link";
import { CategoryChip } from "./category-chip";

export type ArticleCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  author: string;
  reading_time: number | null;
  featured_image: string | null;
  published_at: string;
  category_slug: string | null;
  category_name: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all duration-300 hover:border-indigo-500/25 hover:bg-white/[0.04]">
      {article.featured_image && (
        <Link
          href={`/blog/${article.slug}`}
          className="relative block aspect-[16/9] overflow-hidden bg-zinc-900"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.featured_image}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      )}

      <div className="flex flex-1 flex-col gap-4 p-6">
        {article.category_slug && article.category_name && (
          <div>
            <CategoryChip
              slug={article.category_slug}
              name={article.category_name}
            />
          </div>
        )}

        <Link href={`/blog/${article.slug}`} className="block">
          <h3 className="text-xl font-semibold leading-snug tracking-tight text-zinc-100 transition-colors group-hover:text-white">
            {article.title}
          </h3>
        </Link>

        {article.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">
            {article.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">{article.author}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-zinc-700" />
          <span>{formatDate(article.published_at)}</span>
          {article.reading_time ? (
            <>
              <span className="h-0.5 w-0.5 rounded-full bg-zinc-700" />
              <span>{article.reading_time} min read</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
