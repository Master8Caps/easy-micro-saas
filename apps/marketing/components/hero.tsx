import Link from "next/link";
import { AnimateOnScroll } from "./animate-on-scroll";

// Copy kept as extractable strings so the calm/Scandinavian variant can swap
// tone without touching markup. See docs/native.md.
const copy = {
  eyebrow: "Your marketing, done for you",
  headlineLead: "You built it.",
  headlineAccent: "We market it.",
  subline:
    "Social, ads, email and content — auto-created from your brand and ready to ship. Everything in one place for £49.95 a month.",
  primaryCta: "Start for £49.95/mo",
  secondaryCta: "See your free brand DNA first",
  trust: "Free brand DNA & avatars · No card to start · Cancel anytime",
};

export function Hero() {
  return (
    <section className="relative px-6 pt-32 pb-20 md:pt-48 md:pb-32">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[800px] w-[1000px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-500/[0.07] blur-[150px]" />
        <div className="absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/[0.04] blur-[120px] animate-pulse-glow" />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <AnimateOnScroll>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse-glow" />
            <span className="text-xs font-medium tracking-wide text-zinc-400">
              {copy.eyebrow}
            </span>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={80}>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-7xl lg:text-[5.25rem]">
            {copy.headlineLead}{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              {copy.headlineAccent}
            </span>
          </h1>
        </AnimateOnScroll>

        <AnimateOnScroll delay={160}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
            {copy.subline}
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={240}>
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/[0.1]"
              >
                {copy.primaryCta}
              </Link>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
              >
                {copy.secondaryCta}
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
            <p className="text-sm text-zinc-500">{copy.trust}</p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
