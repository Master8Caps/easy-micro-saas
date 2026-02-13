import { AnimateOnScroll } from "./animate-on-scroll";
import { WaitlistButton } from "./waitlist-form";

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
              Your go-to-market engine
            </span>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={80}>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-7xl lg:text-[5.25rem]">
            You shipped.{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Now what?
            </span>
          </h1>
        </AnimateOnScroll>

        <AnimateOnScroll delay={160}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
            Turn a five-minute product brief into targeted avatars, campaign
            angles, ready-to-post content, and tracked links — so you know
            exactly who to reach, what to say, and what&apos;s working.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={240}>
          <div className="mt-10 flex flex-col items-center gap-4">
            <WaitlistButton source="hero" label="Get Early Access" />
            <p className="text-sm text-zinc-500">
              Free early access &middot; No credit card required
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
