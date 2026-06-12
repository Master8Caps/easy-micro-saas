import type { MagicBrand, MagicSamplePost } from "@/lib/magic/types";
import { platformTheme } from "@/lib/magic/post-graphic-style";
import { PostGraphic } from "./post-graphic";

export function BrandedPost({
  post,
  brand,
}: {
  post: MagicSamplePost;
  brand: MagicBrand;
}) {
  const accent = brand.palette[0] ?? "#6366f1";
  // The graphic already carries the caption on text-heavy platforms — don't repeat it below.
  const showCaptionBelow = !platformTheme(post.platform).body;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white text-zinc-900 shadow-xl">
      <div className="flex items-center gap-2 p-3">
        {brand.logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={brand.logoUrl} alt={brand.name} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: accent }}>
            {brand.name.slice(0, 1)}
          </span>
        )}
        <div className="leading-tight">
          <p className="text-sm font-semibold">{brand.name}</p>
          <p className="text-[11px] text-zinc-500">{post.platform}</p>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <PostGraphic post={post} brand={brand} />
      </div>

      <div className="p-3">
        <div className="flex items-center gap-4 py-1 text-zinc-700">
          <span className="text-sm">♥ {post.engagement.likes}</span>
          <span className="text-sm">💬 {post.engagement.comments}</span>
          <span className="text-sm">↗ {post.engagement.shares}</span>
        </div>
        {showCaptionBelow ? (
          <p className="mt-1 text-sm">
            <span className="font-semibold">{brand.name.toLowerCase().replace(/\s+/g, "")}</span>{" "}
            {post.caption}
          </p>
        ) : null}
        <p className="mt-1 text-sm" style={{ color: accent }}>
          {post.hashtags.join(" ")}
        </p>
      </div>
    </div>
  );
}
