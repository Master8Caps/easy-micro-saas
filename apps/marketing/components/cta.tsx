import { AnimateOnScroll } from "./animate-on-scroll";
import { WaitlistButton } from "./waitlist-form";

export function CTA() {
  return (
    <section id="cta" className="relative px-6 py-28 md:py-40">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 translate-y-1/4 rounded-full bg-indigo-500/[0.07] blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 h-[300px] w-[300px] rounded-full bg-violet-500/[0.05] blur-[120px] animate-pulse-glow" />
      </div>

      {/* Subtle divider */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-3xl text-center">
        <AnimateOnScroll>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Stop guessing.{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Start growing.
            </span>
          </h2>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <p className="mx-auto mt-6 max-w-lg text-base text-zinc-400 md:text-lg">
            A five-minute product brief is all it takes. You&apos;ll get customer
            avatars, campaign angles, ready-to-post content, and tracked links
            — everything you need to find your first 100 users.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
          <div className="mt-10 flex flex-col items-center gap-4">
            <WaitlistButton source="cta" label="Get Early Access" />
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-zinc-400">
                Takes 5 minutes to set up &middot; No credit card required
              </p>
              <p className="text-xs text-zinc-600">
                Early access opening soon — join the waitlist to be first
              </p>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
