"use client";

import type { MagicBrand, MagicSamplePost } from "@/lib/magic/types";
import { platformTheme, type PlatformTheme } from "@/lib/magic/post-graphic-style";
import { deriveHeadline } from "@/lib/magic/headline";

const SCALE: Record<PlatformTheme["headlineScale"], string> = {
  lg: "text-3xl",
  md: "text-2xl",
  sm: "text-lg",
};

/**
 * Code-rendered, on-brand social post graphic ("bold statement" direction).
 * Deterministic and instant — replaces the old AI image. Look varies per platform.
 */
export function PostGraphic({ brand, post }: { brand: MagicBrand; post: MagicSamplePost }) {
  const theme = platformTheme(post.platform);
  const headline = post.headline?.trim() || deriveHeadline(post.caption) || brand.tagline || brand.name;
  const accent = brand.palette[0] ?? "#6366f1";
  const accent2 = brand.palette[1] ?? accent;
  const onColor = theme.treatment !== "darkAccent";
  const bodyText = post.caption?.trim();

  // 2-3 supporting sentences under the headline (text-heavy platforms only),
  // clamped so they never overflow the graphic.
  const renderBody = (className: string) =>
    theme.body && bodyText ? (
      <p
        className={`mt-2 font-medium ${className}`}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: theme.bodyLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          fontSize: "0.84rem",
          lineHeight: 1.45,
        }}
      >
        {bodyText}
      </p>
    ) : null;

  const logo = (
    <span className="inline-flex items-center gap-2 font-semibold">
      {brand.logoUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={brand.logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: onColor ? "rgba(255,255,255,0.2)" : accent }}
        >
          {brand.name.slice(0, 1)}
        </span>
      )}
      {brand.name}
    </span>
  );

  if (theme.treatment === "darkAccent") {
    return (
      <div
        className="flex w-full flex-col justify-between bg-[#13151a] p-5"
        style={{ aspectRatio: String(theme.aspect) }}
      >
        <span className="h-[3px] w-10 rounded-full" style={{ background: accent }} />
        <div>
          <p className={`font-bold leading-tight tracking-tight text-zinc-100 ${SCALE[theme.headlineScale]}`}>{headline}</p>
          {renderBody("text-zinc-300")}
          {!theme.body && theme.subhead && brand.tagline ? (
            <p className="mt-1 text-sm font-medium" style={{ color: accent2 }}>{brand.tagline}</p>
          ) : null}
        </div>
        <span className="text-xs text-zinc-400">{logo}</span>
      </div>
    );
  }

  const background = theme.treatment === "solid" ? accent : `linear-gradient(140deg, ${accent}, ${accent2})`;
  const footer = `${theme.hashtag && post.hashtags[0] ? post.hashtags[0] : ""}${theme.emoji ? " ✨" : ""}`.trim();

  return (
    <div
      className="flex w-full flex-col justify-between p-5 text-white"
      style={{ background, aspectRatio: String(theme.aspect) }}
    >
      <span className="text-xs">{logo}</span>
      <div>
        <p className={`font-extrabold leading-[1.1] tracking-tight ${SCALE[theme.headlineScale]}`}>{headline}</p>
        {renderBody("text-white/90")}
      </div>
      <span className="text-xs font-semibold text-white/85">{footer}</span>
    </div>
  );
}
