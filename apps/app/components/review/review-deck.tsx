"use client";

import { useState } from "react";
import { SwipeDeck, type SwipeDirection } from "@repo/ui";
import { PostCard } from "./post-card";
import { REJECT_REASONS } from "@/lib/review/reject-reasons";
import { approveDraft, rejectDraft, undoLastDecision, type ReviewCard } from "@/server/actions/review";

const REJECT_STAMP = (
  <span className="-rotate-12 rounded-lg border-2 border-red-400 px-3 py-1 text-lg font-extrabold tracking-wider text-red-300">
    REJECT ✗
  </span>
);
const APPROVE_STAMP = (
  <span className="rotate-12 rounded-lg border-2 border-emerald-400 px-3 py-1 text-lg font-extrabold tracking-wider text-emerald-300">
    APPROVE ♥
  </span>
);

export function ReviewDeck({ initialCards }: { initialCards: ReviewCard[] }) {
  const [cards] = useState(initialCards);
  const [approved, setApproved] = useState(0);
  // pieceId of the just-rejected card whose reason panel is open.
  const [reasonFor, setReasonFor] = useState<string | null>(null);

  function onDecide(card: ReviewCard, direction: SwipeDirection) {
    if (direction === "right") {
      setApproved((n) => n + 1);
      void approveDraft(card.id);
      setReasonFor(null);
    } else {
      void rejectDraft(card.id); // fire immediately; reason is optional
      setReasonFor(card.id);
    }
  }

  function onUndo(card: ReviewCard) {
    void undoLastDecision(card.id);
    setReasonFor(null);
  }

  function pickReason(pieceId: string, slug: string) {
    void rejectDraft(pieceId, slug);
    setReasonFor(null);
  }

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <SwipeDeck<ReviewCard>
        items={cards}
        keyFor={(c) => c.id}
        renderCard={(c) => <PostCard card={c} />}
        onDecide={onDecide}
        onUndo={onUndo}
        leftLabel={REJECT_STAMP}
        rightLabel={APPROVE_STAMP}
        renderEmpty={() => (
          <div className="rounded-2xl border border-line bg-surface-card p-8 text-center">
            <div className="text-3xl">🎉</div>
            <h3 className="mt-2 font-heading text-lg font-semibold text-content-primary">All caught up</h3>
            <p className="mt-1 text-sm text-content-muted">{approved} approved this session.</p>
          </div>
        )}
      />

      {reasonFor && (
        <div className="mt-4 animate-fade-in rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4">
          <p className="mb-2 text-xs text-red-300">Binned. Why? <span className="text-content-muted">(optional)</span></p>
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r.slug}
                type="button"
                onClick={() => pickReason(reasonFor, r.slug)}
                className="rounded-full border border-line px-2.5 py-1 text-[11px] text-content-secondary hover:border-indigo-400 hover:text-content-primary"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
