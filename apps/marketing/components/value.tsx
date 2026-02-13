import { AnimateOnScroll } from "./animate-on-scroll";
import { GlowCard } from "./glow-card";

const values = [
  {
    input: "Describe your product",
    output: "Get targeted customer avatars",
    description:
      "Know exactly who to reach — their pain points, motivations, and where they spend time online.",
  },
  {
    input: "Pick your channels",
    output: "Get campaign angles with hooks",
    description:
      "Specific campaign ideas per avatar with opening lines ready to post. Social, ads, email — tailored to each channel.",
  },
  {
    input: "Publish and track",
    output: "See what actually resonates",
    description:
      "Every piece of content gets a tracked link. See which hooks, avatars, and channels drive real clicks.",
  },
];

export function Value() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-indigo-500/[0.04] blur-[150px]" />
      </div>

      {/* Subtle divider */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <AnimateOnScroll>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              The trade
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              You bring the product.{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                We build the engine.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-zinc-400">
              A simple exchange. Five minutes of context from you — a complete
              go-to-market system in return.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {values.map((value, i) => (
            <AnimateOnScroll key={value.input} delay={i * 100}>
              <GlowCard className="p-6 md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  {value.input}
                </p>
                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/40 to-transparent" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400/60">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <div className="h-px flex-1 bg-gradient-to-l from-violet-500/40 to-transparent" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100">
                  {value.output}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {value.description}
                </p>
              </GlowCard>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
