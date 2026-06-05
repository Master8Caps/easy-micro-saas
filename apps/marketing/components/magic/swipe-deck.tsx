"use client";

import { useState } from "react";

const SAMPLES = [
  { platform: "Instagram", caption: "You shipped. Now what? Here's the plan.", tag: "#buildinpublic" },
  { platform: "X", caption: "3 lessons from launch week 🧵", tag: "#indiehackers" },
  { platform: "LinkedIn", caption: "The tool won't save you. The system will.", tag: "#saas" },
  { platform: "Instagram", caption: "How we found our first 100 users.", tag: "#startup" },
];

export function SwipeDeck({ onDone }: { onDone?: () => void }) {
  const [index, setIndex] = useState(0);
  const current = SAMPLES[index];

  function swipe() {
    const next = index + 1;
    if (next >= SAMPLES.length) {
      onDone?.();
      setIndex(next);
      return;
    }
    setIndex(next);
  }

  if (index >= SAMPLES.length) {
    return (
      <p className="text-center text-sm text-zinc-400">Nice — that&apos;s the idea. Almost ready…</p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <p className="mb-4 text-center text-sm text-zinc-400">
        Try the swipe-to-approve queue while we work ✨
      </p>
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-3 shadow-xl">
        <p className="mb-2 text-xs text-zinc-400">{current.platform}</p>
        <div className="h-40 rounded-xl bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-zinc-800" />
        <p className="mt-3 text-sm text-zinc-200">{current.caption}</p>
        <p className="mt-1 text-xs text-indigo-300/80">{current.tag}</p>
        <div className="mt-4 flex items-center justify-center gap-6">
          <button onClick={swipe} aria-label="Skip" className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">✗</button>
          <button onClick={swipe} aria-label="Approve" className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">♥</button>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-600">{index + 1} / {SAMPLES.length}</p>
    </div>
  );
}
