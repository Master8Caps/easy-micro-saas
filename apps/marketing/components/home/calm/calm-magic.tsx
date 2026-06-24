import { calmHome } from "@/content/home.calm";

export function CalmMagic() {
  const c = calmHome.magic;
  return (
    <section className="bg-primary px-6 py-16 text-center text-paper">
      <p className="mb-3 text-xs uppercase tracking-[0.26em] text-sage">{c.eyebrow}</p>
      <h2 className="font-heading text-3xl">{c.heading}</h2>
      <p className="mx-auto mt-2 max-w-[46ch] text-sage">{c.subline}</p>
      <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-4">
        <div className="w-56 rounded-xl border border-paper/10 bg-ink/20 p-5 text-left">
          <p className="mb-3 text-xs uppercase tracking-wide text-sage">{c.dnaLabel}</p>
          <div className="mb-2 h-2 rounded bg-paper/20" />
          <div className="mb-2 h-2 w-4/5 rounded bg-paper/20" />
          <div className="h-2 w-1/2 rounded bg-accent" />
        </div>
        <div className="w-56 rounded-xl border border-paper/10 bg-ink/20 p-5 text-left">
          <p className="mb-3 text-xs uppercase tracking-wide text-sage">{c.audienceLabel}</p>
          {["bg-sage", "bg-accent", "bg-birch"].map((b) => (
            <div key={b} className="mb-2 flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full ${b}`} />
              <span className="h-2 flex-1 rounded bg-paper/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
