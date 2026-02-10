export function Hero() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          Your first 100 users are closer than you think
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
          Turn a simple product brief into targeted campaigns, content, and
          tracking. Stop guessing what to post, where to post it, and whether
          it&apos;s working.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="#cta"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Get Started
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 px-8 py-3 text-base font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}
