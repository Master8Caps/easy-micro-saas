import { AnimateOnScroll } from "./animate-on-scroll";
import { WaitlistFormCompact } from "./waitlist-form";

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
          <div className="mx-auto mt-10 max-w-lg">
            <WaitlistFormCompact source="hero" />
            <p className="mt-3 text-sm text-zinc-500">
              Join the waitlist for early access. No spam, ever.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
