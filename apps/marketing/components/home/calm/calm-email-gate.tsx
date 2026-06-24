import { calmHome } from "@/content/home.calm";

export function CalmEmailGate() {
  const c = calmHome.emailGate;
  return (
    <section className="border-b border-ink/[0.06] bg-birch/10 px-6 py-14 text-center">
      <h2 className="font-heading text-2xl text-ink">{c.heading}</h2>
      <p className="mx-auto mt-2 max-w-[42ch] text-sm text-muted">{c.subline}</p>
      {/* Submits into the existing magic flow (/start), which captures the email
          downstream. Wiring a direct magic_leads capture from here is a follow-up. */}
      <form action="/start" method="get" className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          placeholder={c.placeholder}
          aria-label="Your email address"
          className="flex-1 rounded-full border border-ink/10 bg-surface px-5 py-3 text-sm text-ink placeholder-muted/60 focus:border-primary/50 focus:outline-none"
        />
        <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-paper transition-all hover:opacity-90">
          {c.cta}
        </button>
      </form>
    </section>
  );
}
