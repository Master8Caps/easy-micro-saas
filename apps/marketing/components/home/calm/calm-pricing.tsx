import Link from "next/link";
import { calmHome } from "@/content/home.calm";

export function CalmPricing() {
  const c = calmHome.pricing;
  return (
    <section id="pricing" className="px-6 py-16 text-center">
      <h2 className="mb-6 font-heading text-2xl text-ink">{c.heading}</h2>
      <div className="mx-auto max-w-xs rounded-2xl border border-ink/[0.08] bg-surface p-8">
        <div className="font-heading text-4xl text-ink">
          {c.price}<span className="text-base text-muted">{c.period}</span>
        </div>
        <p className="my-4 text-sm leading-relaxed text-muted">{c.includes}</p>
        <Link href="/start" className="block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-paper transition-all hover:opacity-90">
          {c.cta}
        </Link>
      </div>
    </section>
  );
}
