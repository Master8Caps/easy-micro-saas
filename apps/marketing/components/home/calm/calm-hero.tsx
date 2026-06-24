import { calmHome } from "@/content/home.calm";
import { CalmHeroUrlInput } from "./calm-hero-url-input";

export function CalmHero() {
  const c = calmHome.hero;
  return (
    <section className="px-6 pt-20 pb-24 text-center">
      <p className="mb-5 text-xs uppercase tracking-[0.26em] text-sage">{c.eyebrow}</p>
      <h1 className="mx-auto max-w-[16ch] font-heading text-5xl leading-[1.12] text-ink md:text-6xl">
        {c.headline}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">{c.subline}</p>
      <div className="mt-9 flex flex-col items-center gap-3">
        <CalmHeroUrlInput />
        <p className="text-xs text-muted/70">{c.reassurance}</p>
      </div>
    </section>
  );
}
