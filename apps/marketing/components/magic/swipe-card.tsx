"use client";

import { useRef, useState, type PointerEvent } from "react";
import {
  isCorrectSwipe,
  resolveDrag,
  glowFromDrag,
  type SwipeDirection,
  type SwipeExpectation,
} from "@/lib/magic/swipe-gate";

/** Drag distance (px) at which a release commits the swipe. */
const THRESHOLD = 100;
/** How far off-screen a committed card flies. */
const FLING_DISTANCE = 600;
/** Let the fly-off animation play before the parent swaps the card. */
const FLING_MS = 220;

export type SwipeCardExample = {
  platform: string;
  caption: string;
  gradient: string;
  /** Optional static image; falls back to the gradient if missing or it fails to load. */
  image?: string;
  expected: SwipeExpectation;
};

type Props = {
  example: SwipeCardExample;
  /** Fired once a card is thrown past the threshold. Parent decides advance vs. hint. */
  onResolve: (direction: SwipeDirection) => void;
};

/**
 * A pick-up-and-throw card. Follows the pointer with a Tinder-style tilt and a
 * red (bin) / green (save) glow. A correct throw flies off-screen; a wrong one
 * springs back so the teaching gate can show its hint.
 */
export function SwipeCard({ example, onResolve }: Props) {
  const [dx, setDx] = useState(0);
  const [active, setActive] = useState(false);
  const [flung, setFlung] = useState<SwipeDirection | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const startX = useRef(0);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (flung) return;
    setActive(true);
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!active) return;
    setDx(e.clientX - startX.current);
  }

  function onPointerUp() {
    if (!active) return;
    setActive(false);
    const direction = resolveDrag(dx, THRESHOLD);
    if (!direction) {
      setDx(0); // didn't pull far enough — snap back
      return;
    }
    if (isCorrectSwipe(example.expected, direction)) {
      setFlung(direction); // correct — throw it off-screen
      setTimeout(() => onResolve(direction), FLING_MS);
    } else {
      setDx(0); // wrong direction — snap back, parent shows the hint
      onResolve(direction);
    }
  }

  const translateX = flung ? (flung === "left" ? -FLING_DISTANCE : FLING_DISTANCE) : dx;
  const rotate = Math.max(-18, Math.min(18, translateX * 0.05));
  const glow = flung ? { side: flung, opacity: 1 } : glowFromDrag(dx, THRESHOLD);
  const ring =
    glow.side === "left"
      ? "0 0 40px rgba(239,68,68,0.55)"
      : glow.side === "right"
        ? "0 0 40px rgba(16,185,129,0.55)"
        : "0 10px 30px rgba(0,0,0,0.4)";

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative cursor-grab touch-none select-none rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-3 shadow-xl active:cursor-grabbing"
      style={{
        transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
        boxShadow: ring,
        opacity: flung ? 0 : 1,
        transition: active ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out, box-shadow 0.15s",
      }}
    >
      {/* Bin overlay (left) */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-start rounded-2xl bg-red-500/20 pl-5"
        style={{ opacity: glow.side === "left" ? glow.opacity : 0, transition: active ? "none" : "opacity 0.15s" }}
        aria-hidden
      >
        <span className="-rotate-12 rounded-lg border-2 border-red-400 px-3 py-1 text-lg font-extrabold tracking-wider text-red-300">
          BIN 🗑
        </span>
      </div>

      {/* Save overlay (right) */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl bg-emerald-500/20 pr-5"
        style={{ opacity: glow.side === "right" ? glow.opacity : 0, transition: active ? "none" : "opacity 0.15s" }}
        aria-hidden
      >
        <span className="rotate-12 rounded-lg border-2 border-emerald-400 px-3 py-1 text-lg font-extrabold tracking-wider text-emerald-300">
          SAVE ♥
        </span>
      </div>

      <p className="mb-2 text-xs text-zinc-400">{example.platform}</p>
      <div className="h-40 overflow-hidden rounded-xl" style={{ background: example.gradient }}>
        {example.image && !imgFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={example.image}
            alt=""
            draggable={false}
            onError={() => setImgFailed(true)}
            className="pointer-events-none h-full w-full select-none object-cover"
          />
        )}
      </div>
      <p className="mt-3 text-sm text-zinc-200">{example.caption}</p>
    </div>
  );
}
