export function Proof() {
  const stats = [
    {
      value: "3",
      label: "Internal products launched using this system",
    },
    {
      value: "< 2 weeks",
      label: "Average time to first 50 users",
    },
    {
      value: "4x",
      label: "Faster than manual campaign planning",
    },
  ];

  return (
    <section className="border-t border-zinc-800 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Built and tested internally first
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
          We built this to launch our own products. The system works because we
          use it every day.
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center"
            >
              <div className="text-4xl font-bold text-zinc-100">
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </div>
        <blockquote className="mx-auto mt-12 max-w-2xl border-l-2 border-zinc-700 pl-6 text-lg text-zinc-300 italic">
          &ldquo;This replaced four separate tools and a spreadsheet. We went
          from scattered posting to a structured system in one afternoon.&rdquo;
        </blockquote>
      </div>
    </section>
  );
}
