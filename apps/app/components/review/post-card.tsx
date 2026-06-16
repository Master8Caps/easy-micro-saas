"use client";

import { useEffect, useRef, useState } from "react";
import type { ReviewCard } from "@/server/actions/review";
import { ChannelPill, TypePill } from "@/components/pills";

const GRADIENTS = [
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

  // Image posts get the visual box; pure text posts let the copy lead.
  const showVisual = Boolean(card.imageUrl) || card.type === "image-prompt";

  // Measure while collapsed so "Show more" only appears when text is clipped.
  useEffect(() => {
    if (expanded) return;
    const el = bodyRef.current;
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [card.body, expanded, showVisual]);

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
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
          <span className="truncate">{card.productName}</span>
        </span>
        {card.channel && <ChannelPill channel={card.channel} />}
      </div>

      {/* Visual block — only for posts that actually have (or expect) an image */}
      {showVisual && (
        <>
          <div
            className="mb-3 h-40 overflow-hidden rounded-xl"
            style={{ background: gradientFor(card.id) }}
          >
            {card.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.imageUrl} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />
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
          className="mt-2 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
        >
          {expanded ? "Show less ▴" : "Show more ▾"}
        </button>
      )}

      {/* Meta row sits at the bottom on text-only posts */}
      {!showVisual && <div className="mt-3">{metaRow}</div>}
    </div>
  );
}
