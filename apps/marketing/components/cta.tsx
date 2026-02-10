export function CTA() {
  return (
    <section
      id="cta"
      className="border-t border-zinc-800 px-6 py-24 md:py-32"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
          Ready to find your first 100 users?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
          Start with a five-minute brief. Get a complete go-to-market engine
          with avatars, campaigns, content, and tracking.
        </p>
        <div className="mt-10">
          <a
            href={process.env.NEXT_PUBLIC_APP_URL || "#"}
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Get Started Free
          </a>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          No credit card required. Set up in under five minutes.
        </p>
      </div>
    </section>
  );
}
