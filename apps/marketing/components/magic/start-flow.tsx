"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { MagicResult } from "@/lib/magic/types";
import { StoryCarousel } from "./story-carousel";
import { Reveal } from "./reveal";

type Phase = "input" | "analysing" | "needsDescription" | "emailGate" | "reveal";

export function StartFlow({ initialUrl = "" }: { initialUrl?: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [url, setUrl] = useState(initialUrl);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [result, setResult] = useState<MagicResult | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const analyse = useCallback(
    async (targetUrl: string, desc?: string) => {
      setError("");
      setPhase("analysing");
      setReady(false);
      try {
        const res = await fetch("/api/magic/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl, description: desc }),
        });
        const data = await res.json();
        if (data.needsDescription) {
          setPhase("needsDescription");
          return;
        }
        if (!res.ok) {
          setError(data.error || "Something went wrong.");
          setPhase("input");
          return;
        }
        setId(data.id);
        setResult(data.result);
        setReady(true);
      } catch {
        setError("Something went wrong. Please try again.");
        setPhase("input");
      }
    },
    [],
  );

  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStarted.current && initialUrl.trim()) {
      autoStarted.current = true;
      analyse(initialUrl.trim());
    }
  }, [initialUrl, analyse]);

  async function handleUnlock() {
    if (unlocking) return;
    setError("");
    setUnlocking(true);
    try {
      const res = await fetch("/api/magic/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setPhase("reveal");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUnlocking(false);
    }
  }

  // ---- Render per phase ----

  if (phase === "input") {
    return (
      <Centered>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">See your brand, decoded.</h1>
        <p className="mt-3 text-zinc-400">Enter your website &mdash; we&apos;ll analyse it and show your brand DNA, avatars, and sample posts. Free.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (url.trim()) analyse(url); }}
          className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourwebsite.com" className="flex-1 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none" />
          <button type="submit" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">Analyse my site &rarr;</button>
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Centered>
    );
  }

  if (phase === "needsDescription") {
    return (
      <Centered>
        <h1 className="text-2xl font-bold tracking-tight">Tell us a touch more</h1>
        <p className="mt-3 text-zinc-400">We couldn&apos;t read enough from your site. In one line, what does your business do?</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (description.trim()) analyse(url, description); }}
          className="mt-8 flex w-full max-w-md flex-col gap-3"
        >
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. A booking app for dog groomers" className="rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none" />
          <button type="submit" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">Continue &rarr;</button>
        </form>
      </Centered>
    );
  }

  if (phase === "analysing") {
    return (
      <Centered>
        <StoryCarousel url={url} ready={ready} onDone={() => setPhase("emailGate")} />
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Centered>
    );
  }

  if (phase === "emailGate") {
    return (
      <Centered>
        <h1 className="text-2xl font-bold tracking-tight">Your Brand DNA is ready ✨</h1>
        <p className="mt-3 text-zinc-400">Pop in your email to reveal it &mdash; we&apos;ll send you a copy too.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); handleUnlock(); }}
          className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none" />
          <button type="submit" disabled={unlocking} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50">{unlocking ? "Revealing…" : "Reveal it →"}</button>
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Centered>
    );
  }

  // reveal
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      {result && <Reveal result={result} />}
      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Ready to put it to work?</h2>
        <p className="text-zinc-400">Unlock the full machine &mdash; content queue, ads, scheduling and more.</p>
        <button
          onClick={() => router.push(`/signup?lead=${id}`)}
          className="mt-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
        >
          Start for £49.95/mo
        </button>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}
