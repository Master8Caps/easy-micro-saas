export function Value() {
  const values = [
    {
      input: "Describe your product",
      output: "Get targeted avatars",
      description:
        "Know exactly who to reach, what they care about, and where they spend their time.",
    },
    {
      input: "Pick your channels",
      output: "Get campaign angles",
      description:
        "Receive specific campaign ideas tailored per avatar for organic and paid channels.",
    },
    {
      input: "Publish and track",
      output: "See what works",
      description:
        "Every link is tracked. See which hooks, angles, and avatars drive real clicks.",
    },
  ];

  return (
    <section className="border-t border-zinc-800 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Describe your product. Get a growth engine.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
          A clear trade. You bring the product context. We generate the system.
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {values.map((value) => (
            <div key={value.input} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-100">
                {values.indexOf(value) + 1}
              </div>
              <p className="mt-4 text-sm font-medium text-zinc-500">
                {value.input}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-zinc-100">
                {value.output}
              </h3>
              <p className="mt-2 text-zinc-400">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
