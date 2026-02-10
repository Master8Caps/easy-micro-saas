import { AnimateOnScroll } from "./animate-on-scroll";
import { WaitlistForm } from "./waitlist-form";

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
          <div className="mx-auto mt-10 max-w-2xl">
            <WaitlistForm source="cta" />
            <p className="mt-4 text-sm text-zinc-500">
              Early access opening soon. Join the waitlist to be first in line.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
