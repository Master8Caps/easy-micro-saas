import { AnimateOnScroll } from "./animate-on-scroll";

export function CTA() {
  return (
    <section
      id="cta"
      className="relative border-t border-zinc-800/50 px-6 py-28 md:py-36"
    >
      {/* Subtle glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 translate-y-1/4 rounded-full bg-blue-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <AnimateOnScroll>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Ready to find your first 100 users?
          </h2>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
            Start with a five-minute brief. Get a complete go-to-market engine
            with avatars, campaigns, content, and tracking.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
          <div className="mt-10">
            <a
              href={process.env.NEXT_PUBLIC_APP_URL || "#"}
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-zinc-950 shadow-lg shadow-white/10 transition-all hover:bg-zinc-200 hover:shadow-white/20"
            >
              Get Started Free
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            No credit card required. Set up in under five minutes.
          </p>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
