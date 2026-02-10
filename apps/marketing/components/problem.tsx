export function Problem() {
  const problems = [
    {
      title: "No system",
      description:
        "You write content when you remember to. There is no plan, no calendar, and no consistency.",
    },
    {
      title: "No feedback",
      description:
        "You post and hope for the best. Nothing tells you what worked, what didn't, or what to try next.",
    },
    {
      title: "Wrong channels",
      description:
        "You pick platforms based on advice, not data. Your audience might not even be there.",
    },
    {
      title: "No positioning",
      description:
        "You describe your product the same way to everyone. Different people need different messages.",
    },
  ];

  return (
    <section className="border-t border-zinc-800 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          You built the product. Now what?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
          Most founders get stuck in the same loop. They ship something great,
          then spend weeks trying to figure out how to get anyone to notice.
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <h3 className="text-lg font-semibold text-zinc-100">
                {problem.title}
              </h3>
              <p className="mt-2 text-zinc-400">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
