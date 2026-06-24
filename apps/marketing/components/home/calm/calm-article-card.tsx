import Link from "next/link";
import type { ArticleCardData } from "@/components/blog/article-card";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CalmArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-surface transition-all duration-300 hover:border-accent/30">
      {article.featured_image && (
        <Link
          href={`/blog/${article.slug}`}
          className="relative block aspect-[16/9] overflow-hidden bg-birch/20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.featured_image}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Link href={`/blog/${article.slug}`} className="block">
          <h3 className="font-heading text-xl leading-snug text-ink transition-colors group-hover:text-accent">
            {article.title}
          </h3>
        </Link>
        {article.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted">
          <span className="font-medium text-ink">{article.author}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-sage" />
          <span>{formatDate(article.published_at)}</span>
          {article.reading_time ? (
            <>
              <span className="h-0.5 w-0.5 rounded-full bg-sage" />
              <span>{article.reading_time} min read</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
