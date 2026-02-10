export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Brief",
      description:
        "Tell us about your product, your market, and your goals. Takes about five minutes.",
    },
    {
      step: "02",
      title: "Generate",
      description:
        "Get avatars, campaign angles, a content calendar, and ready-to-publish posts tailored to your product.",
    },
    {
      step: "03",
      title: "Execute and learn",
      description:
        "Publish content, track every click, see what resonates, and let the system improve your next batch.",
    },
  ];

  return (
    <section id="how-it-works" className="border-t border-zinc-800 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Three steps to your first real traction
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
          No complex setup. No integrations required. Start generating campaigns
          in minutes.
        </p>
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step}>
              <div className="text-4xl font-bold text-zinc-700">
                {item.step}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-zinc-100">
                {item.title}
              </h3>
              <p className="mt-2 text-zinc-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
