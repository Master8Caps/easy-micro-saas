"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SwipeCard, type SwipeCardHandle } from "./swipe-card";
import type { SwipeDirection } from "./swipe-gesture";

export interface SwipeDeckProps<T> {
  items: T[];
  keyFor: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  /** Called when the top card is decided. */
  onDecide: (item: T, direction: SwipeDirection) => void;
  /** Called when the user undoes the last decision (restore in your store). */
  onUndo?: (item: T, direction: SwipeDirection) => void;
  leftLabel?: ReactNode;
  rightLabel?: ReactNode;
  renderEmpty?: () => ReactNode;
}

export function SwipeDeck<T>({
  items,
  keyFor,
  renderCard,
  onDecide,
  onUndo,
  leftLabel,
  rightLabel,
  renderEmpty,
}: SwipeDeckProps<T>) {
  const [index, setIndex] = useState(0);
  const last = useRef<{ item: T; direction: SwipeDirection } | null>(null);
  const cardRef = useRef<SwipeCardHandle>(null);

  // Reset when a fresh batch arrives.
  useEffect(() => {
    setIndex(0);
    last.current = null;
  }, [items]);

  const current = items[index];

  function decide(direction: SwipeDirection) {
    if (!current) return;
    last.current = { item: current, direction };
    onDecide(current, direction);
    setIndex((i) => i + 1);
  }

  function undo() {
    if (!last.current) return;
    onUndo?.(last.current.item, last.current.direction);
    last.current = null;
    setIndex((i) => Math.max(0, i - 1));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") cardRef.current?.flick("left");
      else if (e.key === "ArrowRight") cardRef.current?.flick("right");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!current) {
    return <div>{renderEmpty?.() ?? null}</div>;
  }

  const peek = items.slice(index + 1, index + 3);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm">
        {peek.map((item, i) => (
          <div
            key={keyFor(item)}
            aria-hidden
            className="absolute inset-0 rounded-2xl border border-line bg-surface-card"
            style={{ transform: `translateY(${(i + 1) * 7}px) scale(${1 - (i + 1) * 0.025})`, zIndex: 0 }}
          />
        ))}
        <div className="relative" style={{ zIndex: 1 }}>
          <SwipeCard
            key={keyFor(current)}
            ref={cardRef}
            onResolve={decide}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          >
            {renderCard(current)}
          </SwipeCard>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => cardRef.current?.flick("left")}
          aria-label="Reject"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-2xl text-red-400 hover:bg-red-500/20"
        >
          ✗
        </button>
        <span className="text-[10px] text-content-muted">← / →<br />or drag</span>
        <button
          type="button"
          onClick={() => cardRef.current?.flick("right")}
          aria-label="Approve"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/45 bg-emerald-500/15 text-2xl text-emerald-400 hover:bg-emerald-500/25"
        >
          ♥
        </button>
      </div>

      {onUndo && last.current && (
        <button
          type="button"
          onClick={undo}
          className="mt-4 text-xs text-content-muted underline hover:text-content-primary"
        >
          Undo last swipe
        </button>
      )}
    </div>
  );
}
