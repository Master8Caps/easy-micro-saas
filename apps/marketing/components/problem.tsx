import { AnimateOnScroll } from "./animate-on-scroll";

const problems = [
  {
    title: "No system",
    description:
      "You write content when inspiration strikes. There is no plan, no calendar, no consistency. Growth stalls because marketing only happens when you remember.",
  },
  {
    title: "No feedback loop",
    description:
      "You publish and move on. Nothing tells you what resonated, what fell flat, or what to double down on. Every post is a shot in the dark.",
  },
  {
    title: "Wrong channels",
    description:
      "You pick platforms based on advice, not evidence. Your ideal users might not even be where you are spending your time.",
  },
  {
    title: "No positioning",
    description:
      "You describe your product the same way to everyone. Different audiences have different pain points — and they need different messages.",
  },
];

export function Problem() {
  return (
    <section className="border-t border-zinc-800/50 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <AnimateOnScroll>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              You built the product. Now what?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400 md:text-lg">
              Most founders get stuck here. They ship something great, then
              spend weeks trying to figure out how to get anyone to notice.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {problems.map((problem, i) => (
            <AnimateOnScroll key={problem.title} delay={i * 100}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900">
                <h3 className="text-lg font-semibold text-zinc-100">
                  {problem.title}
                </h3>
                <p className="mt-2 leading-relaxed text-zinc-400">
                  {problem.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
