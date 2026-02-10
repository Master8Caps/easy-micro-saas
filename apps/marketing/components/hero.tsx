import { AnimateOnScroll } from "./animate-on-scroll";

export function Hero() {
  return (
    <section className="relative px-6 py-28 md:py-40">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-blue-500/[0.07] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <AnimateOnScroll>
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight md:text-7xl lg:text-8xl">
            Your first 100 users are{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              closer than you think
            </span>
          </h1>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            Turn a product brief into targeted avatars, campaigns, and tracked
            content — in minutes. Know exactly who to reach, what to say, and
            what&apos;s working.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#cta"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-zinc-950 shadow-lg shadow-white/10 transition-all hover:bg-zinc-200 hover:shadow-white/20"
            >
              Get Started
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-8 py-3.5 text-base font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            >
              See How It Works
            </a>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
