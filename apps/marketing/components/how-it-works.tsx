import { AnimateOnScroll } from "./animate-on-scroll";

const steps = [
  {
    number: "1",
    title: "Brief",
    description:
      "Tell us about your product, your market, and your goals. Takes about five minutes.",
  },
  {
    number: "2",
    title: "Generate",
    description:
      "Get avatars, campaign angles, a content calendar, and ready-to-publish posts — all tailored to your product.",
  },
  {
    number: "3",
    title: "Execute & learn",
    description:
      "Publish content, track every click, see what resonates, and let the system improve your next batch.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-zinc-800/50 px-6 py-24"
    >
      <div className="mx-auto max-w-5xl">
        <AnimateOnScroll>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Three steps to real traction
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400 md:text-lg">
              No complex setup. No integrations required. Start generating
              campaigns in minutes.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {steps.map((step, i) => (
            <AnimateOnScroll key={step.number} delay={i * 120}>
              <div>
                <div className="text-5xl font-bold text-zinc-800">
                  {step.number}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-zinc-100">
                  {step.title}
                </h3>
                <p className="mt-3 leading-relaxed text-zinc-400">
                  {step.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
