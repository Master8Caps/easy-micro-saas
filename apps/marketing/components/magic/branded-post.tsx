import type { MagicBrand, MagicSamplePost } from "@/lib/magic/types";

export function BrandedPost({
  post,
  brand,
}: {
  post: MagicSamplePost;
  brand: MagicBrand;
}) {
  const accent = brand.palette[0] ?? "#6366f1";
  const accent2 = brand.palette[1] ?? accent;

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

      <div className="relative h-44 w-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
        <span className="absolute bottom-2 right-3 text-xs font-semibold text-white/70">{brand.name}</span>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-4 py-1 text-zinc-700">
          <span className="text-sm">♥ {post.engagement.likes}</span>
          <span className="text-sm">💬 {post.engagement.comments}</span>
          <span className="text-sm">↗ {post.engagement.shares}</span>
        </div>
        <p className="mt-1 text-sm">
          <span className="font-semibold">{brand.name.toLowerCase().replace(/\s+/g, "")}</span>{" "}
          {post.caption}
        </p>
        <p className="mt-1 text-sm" style={{ color: accent }}>
          {post.hashtags.join(" ")}
        </p>
      </div>
    </div>
  );
}
