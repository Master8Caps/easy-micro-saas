"use client";

import { useState } from "react";
import { nextIndex } from "@/lib/magic/carousel";
import { JOURNEY_SAMPLE_POSTS } from "@/lib/magic/journey-cards";

type Props = {
  /** True once the analysis result is ready. */
  ready: boolean;
  /** Called when the user chooses to see their results. */
  onDone: () => void;
};

// Card sequence: 0 = hook, 1 = swipe beat, 2 = the full machine, 3 = finale.
const LAST_CARD = 3;

export function StoryCarousel({ ready, onDone }: Props) {
  const [card, setCard] = useState(0);
  const [swipeIdx, setSwipeIdx] = useState(0);
  const posts = JOURNEY_SAMPLE_POSTS;
  const post = posts[swipeIdx];

  function advance() {
    setCard((c) => Math.min(c + 1, LAST_CARD));
  }

  function swipe() {
    if (swipeIdx >= posts.length - 1) {
      advance();
      return;
    }
    setSwipeIdx((i) => nextIndex(i, posts.length));
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Skip appears the instant results are ready, on any card. */}
      <div className="mb-4 flex h-8 items-center justify-end">
        {ready && (
          <button
            onClick={onDone}
            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
          >
            Skip to results ✨
          </button>
        )}
      </div>

      {card === 0 && (
        <Card>
          <h2 className="text-2xl font-bold tracking-tight">Meet &ldquo;Tinder for social&rdquo; 🔥</h2>
          <p className="mt-3 text-zinc-400">Approve or bin posts with a swipe — your whole queue, in seconds.</p>
          <NextButton onClick={advance} label="Show me →" />
        </Card>
      )}

      {card === 1 && (
        <Card>
          <p className="mb-4 text-sm text-zinc-400">Try it — swipe a couple while we work ✨</p>
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-3 shadow-xl">
            <p className="mb-2 text-xs text-zinc-400">{post.platform}</p>
            <div className="h-40 rounded-xl" style={{ background: post.gradient }} />
            <p className="mt-3 text-sm text-zinc-200">{post.caption}</p>
            <p className="mt-1 text-xs text-indigo-300/80">{post.tag}</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <button onClick={swipe} aria-label="Skip" className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">✗</button>
              <button onClick={swipe} aria-label="Approve" className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">♥</button>
            </div>
          </div>
          <NextButton onClick={advance} label="Next →" />
        </Card>
      )}

      {card === 2 && (
        <Card>
          <h2 className="text-2xl font-bold tracking-tight">Not just social</h2>
          <p className="mt-3 text-zinc-400">Ads, email, blog posts and tracked links — auto-created in your brand. Social is just the front door.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {["Ads", "Email", "Blog", "Socials"].map((label, i) => (
              <div key={label} className="rounded-xl border border-white/[0.08] p-4 text-sm text-zinc-300" style={{ background: JOURNEY_SAMPLE_POSTS[i].gradient, opacity: 0.9 }}>{label}</div>
            ))}
          </div>
          <NextButton onClick={advance} label="Almost there →" />
        </Card>
      )}

      {card === 3 && (
        <Card>
          {ready ? (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Your Brand DNA is ready ✨</h2>
              <p className="mt-3 text-zinc-400">Let&apos;s take a look.</p>
              <NextButton onClick={onDone} label="See my Brand DNA →" />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Almost there…</h2>
              <p className="mt-3 text-zinc-400">We&apos;re finishing your brand analysis. This jumps in automatically the moment it&apos;s done.</p>
              <div className="mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" />
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="text-center">{children}</div>;
}

function NextButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
      {label}
    </button>
  );
}
