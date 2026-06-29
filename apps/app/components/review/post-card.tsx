"use client";

import { useEffect, useRef, useState } from "react";
import type { ReviewCard } from "@/server/actions/review";
import { ChannelPill, TypePill } from "@/components/pills";
import { imageState } from "@/lib/content/types";
import { generateImage } from "@/server/actions/images";
import { SITE_VARIANT } from "@/lib/variant";

const GRADIENTS =
  SITE_VARIANT === "calm"
    ? [
        "linear-gradient(135deg,#2F4A3C,#C0623E)", // forest → ember
        "linear-gradient(135deg,#88A38B,#2F4A3C)", // sage → forest
        "linear-gradient(135deg,#C2A878,#C0623E)", // birch → ember
        "linear-gradient(135deg,#2F4A3C,#88A38B)", // forest → sage
      ]
    : [
        "linear-gradient(135deg,#6366f1,#a855f7)",
        "linear-gradient(135deg,#0ea5e9,#6366f1)",
        "linear-gradient(135deg,#a855f7,#ec4899)",
      ];

function gradientFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h + ch.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[h];
}

export function PostCard({ card }: { card: ReviewCard }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  // Local image state so a freshly-generated image shows without a reload.
  const [imageUrl, setImageUrl] = useState<string | null>(card.imageUrl);
  const [generating, setGenerating] = useState(false);

  const state = imageState(card.imagePromptUsed, imageUrl);
  // Instagram always wants a visual; pending/ready always show the block.
  const showVisual = state !== "none" || card.type === "instagram-post";

  useEffect(() => {
    if (expanded) return;
    const el = bodyRef.current;
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [card.body, expanded, showVisual]);

  async function handleGenerate(e: React.PointerEvent) {
    e.stopPropagation();
    if (generating) return;
    setGenerating(true);
    try {
      const result = await generateImage(card.id);
      if (result?.imageUrl) setImageUrl(result.imageUrl);
    } catch {
      // generateImage throws on failure; leave the card pending so it can retry.
    } finally {
      setGenerating(false);
    }
  }

  const metaRow = (
    <div className="flex items-center justify-between gap-2">
      <TypePill type={card.type} />
      {card.avatarName && (
        <span className="truncate text-[11px] text-content-muted">For · {card.avatarName}</span>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-line bg-surface-tertiary p-4 shadow-xl">
      {/* Header: product (left) · platform (right) */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-content-primary">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span className="truncate">{card.productName}</span>
        </span>
        {card.channel && <ChannelPill channel={card.channel} />}
      </div>

      {/* Visual block — image, or a pending placeholder with a generate button */}
      {showVisual && (
        <>
          <div
            className="relative mb-3 flex h-40 items-center justify-center overflow-hidden rounded-xl"
            style={{ background: gradientFor(card.id) }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />
            ) : (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => handleGenerate(e as unknown as React.PointerEvent)}
                disabled={generating}
                className="rounded-lg border border-white/30 bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/40 disabled:opacity-60"
              >
                {generating ? "Generating…" : "Generate image"}
              </button>
            )}
          </div>
          <div className="mb-3">{metaRow}</div>
        </>
      )}

      {/* Title + body — body is the hero on text-only posts */}
      {card.title && (
        <p className={`font-semibold text-content-primary ${showVisual ? "text-sm" : "text-base"}`}>
          {card.title}
        </p>
      )}
      <p
        ref={bodyRef}
        className={`mt-1 whitespace-pre-wrap leading-relaxed text-content-secondary ${
          showVisual ? "text-sm" : "text-[15px]"
        } ${expanded ? "" : showVisual ? "line-clamp-4" : "line-clamp-6"}`}
      >
        {card.body}
      </p>

      {(overflowing || expanded) && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-accent/80 transition-colors hover:text-accent/70"
        >
          {expanded ? "Show less ▴" : "Show more ▾"}
        </button>
      )}

      {/* Meta row sits at the bottom on text-only posts */}
      {!showVisual && <div className="mt-3">{metaRow}</div>}
    </div>
  );
}
