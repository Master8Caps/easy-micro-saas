import Link from "next/link";
import { AnimateOnScroll } from "./animate-on-scroll";
import { GlowCard } from "./glow-card";

// Copy kept as extractable strings so the calm/Scandinavian variant can swap
// tone without touching markup. See docs/native.md.
const copy = {
  eyebrow: "Pricing",
  heading: "One price. The whole machine.",
  accent: "The whole machine.",
  subheading:
    "No tiers, no add-ons, no per-seat maths. Everything included from day one.",
  price: "£49.95",
  period: "/month",
  tagline: "Everything, included.",
  features: [
    "Organic social posts, auto-created from your avatars",
    "Ready-to-launch ad sets",
    "“Tinder for social” swipe-to-approve queue",
    "Email campaigns",
    "Blog & SEO content",
    "Landing pages & website kits",
    "Tracked links + performance insights",
    "Customer avatars & brand DNA",
  ],
  cta: "Start for £49.95/mo",
  reassurance: "Cancel anytime · Free brand DNA before you pay",
};

export function Pricing() {
  return (
    <section id="pricing" className="relative px-6 py-24 md:py-32">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.05] blur-[150px]" />
      </div>

      {/* Subtle divider */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-2xl">
        <AnimateOnScroll>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              {copy.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              One price.{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {copy.accent}
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-zinc-400">
              {copy.subheading}
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={120}>
          <GlowCard className="mt-12 p-8 md:p-10">
            <div className="text-center">
              <div className="flex items-end justify-center gap-1">
                <span className="font-heading text-5xl font-bold tracking-tight text-zinc-50 md:text-6xl">
                  {copy.price}
                </span>
                <span className="mb-1.5 text-lg text-zinc-500">
                  {copy.period}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-zinc-400">
                {copy.tagline}
              </p>
            </div>

            <ul className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
              {copy.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-zinc-300"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0 text-indigo-400"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-center gap-3">
              <Link
                href="/signup"
                className="w-full max-w-xs rounded-full bg-white px-8 py-3.5 text-center text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/[0.1]"
              >
                {copy.cta}
              </Link>
              <p className="text-xs text-zinc-500">{copy.reassurance}</p>
            </div>
          </GlowCard>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
