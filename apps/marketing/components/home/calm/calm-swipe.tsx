import { calmHome } from "@/content/home.calm";

export function CalmSwipe() {
  const c = calmHome.swipe;
  return (
    <section className="bg-birch/10 px-6 py-16">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8">
        <div className="max-w-[38ch]">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">{c.eyebrow}</p>
          <h2 className="font-heading text-3xl text-ink">{c.heading}</h2>
          <p className="mt-2 text-sm text-muted">{c.subline}</p>
        </div>
        <div className="relative h-52 w-40 rounded-2xl border border-ink/[0.08] bg-surface p-4 shadow-xl shadow-ink/10">
          <div className="mb-3 h-24 rounded-lg bg-gradient-to-br from-sage to-primary" />
          <div className="mb-2 h-2 rounded bg-ink/10" />
          <div className="h-2 w-2/3 rounded bg-ink/10" />
          <span className="absolute bottom-3 left-4 text-accent">✗</span>
          <span className="absolute bottom-3 right-4 text-primary">♥</span>
        </div>
      </div>
    </section>
  );
}
