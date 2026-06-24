import { calmHome } from "@/content/home.calm";

export function CalmBreadth() {
  const c = calmHome.breadth;
  return (
    <section id="how" className="px-6 py-16 text-center">
      <h2 className="font-heading text-2xl text-ink">{c.heading}</h2>
      <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">{c.subline}</p>
      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
        {c.items.map((item) => (
          <span key={item.label} className="rounded-xl border border-ink/[0.08] bg-surface px-5 py-3.5 text-sm text-ink">
            {item.icon} {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
