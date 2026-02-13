import { AnimateOnScroll } from "./animate-on-scroll";
import { GlowCard } from "./glow-card";

const problems = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
      </svg>
    ),
    title: "No system",
    description: "You post when inspiration strikes. No plan, no calendar, no consistency.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20v-6M6 20V10M18 20V4" />
      </svg>
    ),
    title: "No feedback loop",
    description: "You publish and move on. No idea what resonated or what to double down on.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    ),
    title: "Wrong channels",
    description: "You pick platforms based on advice, not evidence. Your users might be elsewhere.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "No positioning",
    description: "Same message to everyone. Different audiences need different hooks.",
  },
];

export function Problem() {
  return (
    <section className="relative px-6 py-24 md:py-32">
      {/* Subtle divider glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="mx-auto max-w-6xl">
        <AnimateOnScroll>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            The problem
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            You built something great.{" "}
            <span className="text-zinc-500">Marketing shouldn&apos;t be the hard part.</span>
          </h2>
          <p className="mt-4 max-w-xl text-zinc-400">
            Most founders get stuck here. They ship, then spend weeks trying
            to figure out how to get anyone to notice.
          </p>
        </AnimateOnScroll>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {problems.map((problem, i) => (
            <AnimateOnScroll key={problem.title} delay={i * 80}>
              <GlowCard className="p-6">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors group-hover:border-indigo-500/30 group-hover:text-indigo-400">
                  {problem.icon}
                </div>
                <h3 className="text-base font-semibold text-zinc-100">
                  {problem.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                  {problem.description}
                </p>
              </GlowCard>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
