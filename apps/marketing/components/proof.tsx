import { AnimateOnScroll } from "./animate-on-scroll";
import { GlowCard } from "./glow-card";

const stats = [
  { value: "3", label: "Products launched with this system" },
  { value: "<2 wks", label: "To first 50 users on average" },
  { value: "4x", label: "Faster than manual planning" },
];

export function Proof() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      {/* Subtle divider */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="mx-auto max-w-6xl">
        <AnimateOnScroll>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Proof
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Built and tested internally
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              We built this to launch our own products. It works because we use it every day.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {stats.map((stat, i) => (
            <AnimateOnScroll key={stat.label} delay={i * 100}>
              <GlowCard className="p-8 text-center">
                <div className="font-heading text-4xl font-bold bg-gradient-to-br from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
              </GlowCard>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll delay={300}>
          <GlowCard className="mx-auto mt-8 max-w-2xl p-8">
            <blockquote>
              <p className="text-base leading-relaxed text-zinc-300 md:text-lg">
                &ldquo;This replaced four separate tools and a spreadsheet. We
                went from scattered posting to a structured system in one
                afternoon.&rdquo;
              </p>
              <cite className="mt-4 block text-sm font-medium not-italic text-zinc-500">
                — Internal team
              </cite>
            </blockquote>
          </GlowCard>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
