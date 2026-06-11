"use client";

import { useState } from "react";
import { SWIPE_EXAMPLES } from "@/lib/magic/journey-cards";
import {
  isCorrectSwipe,
  nextGateIndex,
  isGateComplete,
  type SwipeDirection,
} from "@/lib/magic/swipe-gate";

type Props = {
  url: string;
  /** True once the analysis result is ready. */
  ready: boolean;
  onDone: () => void;
};

const PAINS = [
  { emoji: "😮‍💨", title: "Posting consistently is brutal", body: "Most founders start strong, then go quiet for three weeks." },
  { emoji: "🤔", title: "You never know what to post", body: "Staring at a blank caption box is where momentum goes to die." },
  { emoji: "🔥", title: "Ads just burn cash", body: "Boosting posts and hoping isn't a strategy. It's a slow leak." },
];

// Steps: 0..2 pains, 3 swipe-intro, 4 swipe-gate, 5 finale.
const PAIN_COUNT = PAINS.length;
const STEP_SWIPE_INTRO = PAIN_COUNT;
const STEP_SWIPE_GATE = PAIN_COUNT + 1;
const STEP_FINALE = PAIN_COUNT + 2;

function hostname(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function StoryCarousel({ url, ready, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [gateIdx, setGateIdx] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const advance = () => setStep((s) => s + 1);
  const example = SWIPE_EXAMPLES[gateIdx];

  function onSwipe(direction: SwipeDirection) {
    const correct = isCorrectSwipe(example.expected, direction);
    if (!correct) {
      setFeedback(
        example.expected === "reject" ? "That one’s spam — swipe left to bin it." : "That’s a good one — swipe right to approve.",
      );
      return;
    }
    setFeedback(example.lesson);
    const next = nextGateIndex(gateIdx, true, SWIPE_EXAMPLES.length);
    setGateIdx(next);
    if (isGateComplete(next, SWIPE_EXAMPLES.length)) {
      setTimeout(advance, 600);
    } else {
      setTimeout(() => setFeedback(null), 600);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-5 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-2 text-zinc-400">
          <span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-emerald-400" : "bg-indigo-400 animate-pulse"}`} />
          {ready ? "Analysis ready" : `Analysing ${hostname(url)}…`}
        </span>
        {ready && (
          <button type="button" onClick={onDone} aria-label="Skip to results" className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300 hover:bg-emerald-500/20">
            Skip to results ✨
          </button>
        )}
      </div>

      {step < PAIN_COUNT && (
        <div className="text-center">
          <div className="text-4xl">{PAINS[step].emoji}</div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">{PAINS[step].title}</h2>
          <p className="mt-3 text-zinc-400">{PAINS[step].body}</p>
          <button type="button" onClick={advance} className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
            {step === PAIN_COUNT - 1 ? "So here’s the fix →" : "Next →"}
          </button>
          <p className="mt-4 text-xs text-zinc-600">{step + 1} / {PAIN_COUNT}</p>
        </div>
      )}

      {step === STEP_SWIPE_INTRO && (
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">This is how you&apos;ll run it 🔥</h2>
          <p className="mt-3 text-zinc-400">We draft everything. You just swipe — left to bin, right to approve. Try it on two now.</p>
          <button type="button" onClick={advance} className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
            Let&apos;s go →
          </button>
        </div>
      )}

      {step === STEP_SWIPE_GATE && example && (
        <div className="text-center">
          <p className="mb-3 text-sm text-zinc-400">
            {example.expected === "reject" ? "Swipe LEFT to bin this one 👎" : "Swipe RIGHT to approve this one 👍"}
          </p>
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-3 shadow-xl">
            <p className="mb-2 text-xs text-zinc-400">{example.platform}</p>
            <div className="h-40 rounded-xl" style={{ background: example.gradient }} />
            <p className="mt-3 text-sm text-zinc-200">{example.caption}</p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <button type="button" onClick={() => onSwipe("left")} aria-label="Swipe left to reject" className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-xl text-red-400 hover:bg-red-500/20">{"✗"}</button>
            <button type="button" onClick={() => onSwipe("right")} aria-label="Swipe right to approve" className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-xl text-emerald-400 hover:bg-emerald-500/25">{"♥"}</button>
          </div>
          {feedback && <p className="mt-3 text-sm text-indigo-300">{feedback}</p>}
          <p className="mt-3 text-xs text-zinc-600">{gateIdx + 1} / {SWIPE_EXAMPLES.length}</p>
        </div>
      )}

      {step >= STEP_FINALE && (
        <div className="text-center">
          {ready ? (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Your Brand DNA is ready ✨</h2>
              <p className="mt-3 text-zinc-400">That&apos;s exactly how the real thing works — let&apos;s see yours.</p>
              <button type="button" onClick={onDone} className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">See my Brand DNA →</button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Nice — you&apos;ve got the hang of it</h2>
              <p className="mt-3 text-zinc-400">Just finishing your brand analysis. This jumps in automatically the moment it&apos;s done.</p>
              <div className="mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
