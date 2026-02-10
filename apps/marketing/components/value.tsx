import { AnimateOnScroll } from "./animate-on-scroll";

const values = [
  {
    step: "01",
    input: "Describe your product",
    output: "Get targeted avatars",
    description:
      "Know exactly who to reach, what they care about, and where they spend their time online.",
  },
  {
    step: "02",
    input: "Pick your channels",
    output: "Get campaign angles",
    description:
      "Receive specific campaign ideas tailored per avatar for organic and paid channels.",
  },
  {
    step: "03",
    input: "Publish and track",
    output: "See what resonates",
    description:
      "Every link is tracked. See which hooks, angles, and avatars drive real engagement.",
  },
];

export function Value() {
  return (
    <section className="border-t border-zinc-800/50 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <AnimateOnScroll>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Describe your product.{" "}
              <span className="text-zinc-500">Get a growth engine.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400 md:text-lg">
              A simple trade. You bring the product context — we generate the
              system to take it to market.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {values.map((value, i) => (
            <AnimateOnScroll key={value.step} delay={i * 120}>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold text-zinc-300">
                  {value.step}
                </div>
                <p className="mt-5 text-sm font-medium uppercase tracking-wider text-zinc-500">
                  {value.input}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-zinc-100">
                  {value.output}
                </h3>
                <p className="mt-3 leading-relaxed text-zinc-400">
                  {value.description}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
