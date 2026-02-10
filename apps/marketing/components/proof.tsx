import { AnimateOnScroll } from "./animate-on-scroll";

const stats = [
  { value: "3", label: "Internal products launched using this system" },
  { value: "<2 wks", label: "Average time to first 50 users" },
  { value: "4x", label: "Faster than manual campaign planning" },
];

export function Proof() {
  return (
    <section className="border-t border-zinc-800/50 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <AnimateOnScroll>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Built and tested internally first
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-400 md:text-lg">
              We built this to launch our own products. The system works because
              we use it every day.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {stats.map((stat, i) => (
            <AnimateOnScroll key={stat.label} delay={i * 100}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center transition-colors hover:border-zinc-700">
                <div className="text-4xl font-bold text-zinc-100">
                  {stat.value}
                </div>
                <p className="mt-2 text-sm text-zinc-400">{stat.label}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll delay={300}>
          <blockquote className="mx-auto mt-12 max-w-2xl border-l-2 border-zinc-700 pl-6">
            <p className="text-lg leading-relaxed italic text-zinc-300">
              &ldquo;This replaced four separate tools and a spreadsheet. We
              went from scattered posting to a structured system in one
              afternoon.&rdquo;
            </p>
            <cite className="mt-3 block text-sm font-medium not-italic text-zinc-500">
              — Internal team
            </cite>
          </blockquote>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
