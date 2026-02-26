"use client";

import { useState } from "react";
import { updateContentRating } from "@/server/actions/content";

export function RatingButtons({
  pieceId,
  initialRating,
}: {
  pieceId: string;
  initialRating: number | null;
}) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [saving, setSaving] = useState(false);

  async function handleRate(value: -1 | 1) {
    const newRating = rating === value ? 0 : value;
    const prevRating = rating;
    setRating(newRating);
    setSaving(true);
    try {
      const result = await updateContentRating(pieceId, newRating as -1 | 0 | 1);
      if (result.error) {
        setRating(prevRating);
      }
    } catch {
      setRating(prevRating);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleRate(1)}
        disabled={saving}
        className={`rounded p-1 transition-colors ${
          rating === 1
            ? "text-emerald-400 bg-emerald-400/10"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
        }`}
        title="Thumbs up"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={rating === 1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
      </button>
      <button
        onClick={() => handleRate(-1)}
        disabled={saving}
        className={`rounded p-1 transition-colors ${
          rating === -1
            ? "text-red-400 bg-red-400/10"
            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
        }`}
        title="Thumbs down"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={rating === -1 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
      </button>
    </div>
  );
}
