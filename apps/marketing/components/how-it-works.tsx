import { AnimateOnScroll } from "./animate-on-scroll";

const steps = [
  {
    number: "1",
    title: "Brief",
    description:
      "Tell us about your product, market, and goals. Takes about five minutes.",
  },
  {
    number: "2",
    title: "Generate",
    description:
      "Get avatars, campaign angles, and ready-to-publish content — all tailored to your product.",
  },
  {
    number: "3",
    title: "Execute & learn",
    description:
      "Publish content, track every click, and see what resonates. Then iterate.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-24 md:py-32">
      {/* Subtle divider */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="mx-auto max-w-6xl">
        <AnimateOnScroll>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Three steps to real traction
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              No complex setup. No integrations. Start generating campaigns in minutes.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="relative mt-16">
          {/* Single continuous purple line behind the numbers */}
          <div className="pointer-events-none absolute top-8 left-[16.67%] right-[16.67%] hidden h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-indigo-500/30 md:block" />

          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <AnimateOnScroll key={step.number} delay={i * 120}>
                <div className="relative text-center">
                  {/* Step number — solid bg masks the line behind it */}
                  <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-zinc-950">
                    <span className="font-heading text-2xl font-bold bg-gradient-to-br from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
                    {step.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
