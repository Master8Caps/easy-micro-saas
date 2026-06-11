"use client";

import { useState } from "react";
import type { MagicBrand, MagicSamplePost } from "@/lib/magic/types";
import { nextIndex, prevIndex } from "@/lib/magic/carousel";
import { BrandedPost } from "./branded-post";
import { usePostImages } from "./use-post-images";

export function BrandedPostCarousel({
  posts,
  brand,
  id,
}: {
  posts: MagicSamplePost[];
  brand: MagicBrand;
  id: string;
}) {
  const [i, setI] = useState(0);
  const images = usePostImages(id, posts);
  if (!posts.length) return null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mx-auto max-w-sm">
        <BrandedPost post={posts[i]} brand={brand} imageUrl={images[i]?.url} loading={images[i]?.loading} />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setI((c) => prevIndex(c, posts.length))}
          disabled={i === 0}
          aria-label="Previous post"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] disabled:opacity-30"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          {posts.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Go to post ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-indigo-400" : "w-1.5 bg-white/20"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setI((c) => nextIndex(c, posts.length))}
          disabled={i === posts.length - 1}
          aria-label="Next post"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </div>
  );
}
