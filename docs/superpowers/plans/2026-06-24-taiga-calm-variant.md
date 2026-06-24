# Taiga Calm-Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a calm "Taiga" brand variant of `apps/marketing` — a semantic-token theming system plus a full Taiga home page — switched by an env flag, with the existing techy site unchanged.

**Architecture:** Option A (one codebase, env flag `NEXT_PUBLIC_SITE_VARIANT`). A `lib/variant.ts` resolver exposes the active variant + brand config. Colours become semantic CSS-variable tokens consumed via Tailwind semantic color names; only the shared `body` element and **new** calm components use tokens — existing techy components keep their literal classes (minimises blast radius). The home route renders calm sections when the variant is `calm`, otherwise the existing techy composition.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS, `next/font/google`, Vitest.

## Global Constraints

- Variant flag: `NEXT_PUBLIC_SITE_VARIANT` ∈ `{techy, calm}`, **default `techy`** when unset/unknown.
- The existing techy site must render **visually unchanged** with no flag or `=techy`.
- Ember palette (calm): paper `#F4EEE3`, ink `#1F2C24`, primary `#2F4A3C`, sage `#88A38B`, accent `#C0623E`, birch `#C2A878`, surface `#FFFFFF`, muted `#4A574C`.
- Calm fonts: headings **Fraunces**, body **DM Sans**. Techy fonts unchanged (Outfit + DM Sans).
- Brand: name **Taiga**, domain **gettaiga.com**, tagline **"Grow your business. Stay calm."**
- Pricing: single plan **£49.95/mo**.
- Reuse existing back ends — magic URL input routes to `/start?url=<enc>`; blog uses `fetchArticles(3)` from `@/lib/blog/articles`. No new generation/data engines.
- Any sample imagery must be art-directed (no generic AI slop); use gradient placeholders until real assets exist.
- Run commands from `apps/marketing`. Tests: `pnpm --filter @repo/marketing test`. Build: `pnpm --filter @repo/marketing build`. Typecheck: `pnpm --filter @repo/marketing typecheck`.

---

### Task 1: Variant resolver + brand config

**Files:**
- Create: `apps/marketing/lib/variant.ts`
- Test: `apps/marketing/lib/variant.test.ts`

**Interfaces:**
- Produces: `type SiteVariant = "techy" | "calm"`; `resolveVariant(value: string | undefined): SiteVariant`; `SITE_VARIANT: SiteVariant`; `interface BrandConfig`; `BRANDS: Record<SiteVariant, BrandConfig>`; `BRAND: BrandConfig`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/marketing/lib/variant.test.ts
import { describe, it, expect } from "vitest";
import { resolveVariant, BRANDS } from "./variant";

describe("resolveVariant", () => {
  it("returns calm only for the exact 'calm' string", () => {
    expect(resolveVariant("calm")).toBe("calm");
  });
  it("defaults to techy for undefined", () => {
    expect(resolveVariant(undefined)).toBe("techy");
  });
  it("defaults to techy for unknown values", () => {
    expect(resolveVariant("xyz")).toBe("techy");
  });
});

describe("BRANDS", () => {
  it("calm brand is Taiga on gettaiga.com", () => {
    expect(BRANDS.calm.name).toBe("Taiga");
    expect(BRANDS.calm.domain).toBe("gettaiga.com");
  });
  it("techy brand keeps the existing title", () => {
    expect(BRANDS.techy.metaTitle).toContain("Easy Micro SaaS");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/marketing test variant`
Expected: FAIL — cannot find module `./variant`.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/marketing/lib/variant.ts
export type SiteVariant = "techy" | "calm";

export function resolveVariant(value: string | undefined): SiteVariant {
  return value === "calm" ? "calm" : "techy";
}

export const SITE_VARIANT: SiteVariant = resolveVariant(
  process.env.NEXT_PUBLIC_SITE_VARIANT,
);

export interface BrandConfig {
  variant: SiteVariant;
  name: string;
  domain: string;
  tagline: string;
  gaId?: string;
  metaTitle: string;
  metaDescription: string;
}

export const BRANDS: Record<SiteVariant, BrandConfig> = {
  techy: {
    variant: "techy",
    name: "Easy Micro SaaS",
    domain: "easymicrosaas.com",
    tagline: "Your Go-To-Market Engine",
    gaId: process.env.NEXT_PUBLIC_GA_ID ?? "G-D03VRT08J9",
    metaTitle: "Easy Micro SaaS — Your Go-To-Market Engine",
    metaDescription:
      "Turn a product brief into targeted campaigns, content, and tracking. Find your first 100 users faster.",
  },
  calm: {
    variant: "calm",
    name: "Taiga",
    domain: "gettaiga.com",
    tagline: "Grow your business. Stay calm.",
    gaId: process.env.NEXT_PUBLIC_GA_ID,
    metaTitle: "Taiga — Grow your business. Stay calm.",
    metaDescription:
      "Drop in your website and Taiga quietly runs your social, ads, email and blog — marketing on autopilot, so you never have to become a marketer.",
  },
};

export const BRAND: BrandConfig = BRANDS[SITE_VARIANT];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/marketing test variant`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/variant.ts apps/marketing/lib/variant.test.ts
git commit -m "feat(marketing): variant resolver + brand config"
```

---

### Task 2: Semantic design tokens + Tailwind colors

**Files:**
- Modify: `apps/marketing/app/globals.css:5-22` (base layer)
- Modify: `apps/marketing/tailwind.config.ts:11-18` (theme.extend)

**Interfaces:**
- Produces: Tailwind color utilities `paper|ink|primary|sage|accent|birch|surface|muted` and font families `font-heading`/`font-body` bound to CSS vars `--color-*`, `--font-heading`, `--font-body`. Consumed by all calm components (Tasks 5–8).

- [ ] **Step 1: Add token blocks + tokenized body to globals.css**

Replace the `@layer base { … }` block (lines 5–22) with:

Tokens are stored as **space-separated RGB channels** (not hex) so Tailwind opacity
modifiers like `bg-paper/90` compile to valid `rgb(... / 0.9)`.

```css
@layer base {
  :root,
  [data-variant="techy"] {
    --color-paper: 9 9 11;        /* zinc-950 */
    --color-ink: 244 244 245;     /* zinc-100 */
    --color-primary: 99 102 241;  /* indigo-500 */
    --color-sage: 129 140 248;
    --color-accent: 139 92 246;
    --color-birch: 167 139 250;
    --color-surface: 24 24 27;
    --color-muted: 161 161 170;
    --font-heading: var(--font-outfit);
    --font-body: var(--font-dm-sans);
  }

  [data-variant="calm"] {
    --color-paper: 244 238 227;   /* #F4EEE3 linen */
    --color-ink: 31 44 36;        /* #1F2C24 pine */
    --color-primary: 47 74 60;    /* #2F4A3C forest */
    --color-sage: 136 163 139;    /* #88A38B */
    --color-accent: 192 98 62;    /* #C0623E ember */
    --color-birch: 194 168 120;   /* #C2A878 */
    --color-surface: 255 255 255; /* #FFFFFF */
    --color-muted: 74 87 76;      /* #4A574C */
    --font-heading: var(--font-fraunces);
    --font-body: var(--font-dm-sans);
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    background-color: rgb(var(--color-paper));
    color: rgb(var(--color-ink));
    @apply antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-heading;
  }
}
```

- [ ] **Step 2: Add semantic colors + token-bound fonts to tailwind.config.ts**

Replace `theme.extend` (lines 11–18) with:

```ts
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        sage: "rgb(var(--color-sage) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        birch: "rgb(var(--color-birch) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "var(--font-outfit)", "sans-serif"],
        body: ["var(--font-body)", "var(--font-dm-sans)", "sans-serif"],
      },
    },
  },
```

- [ ] **Step 3: Verify techy build is unchanged**

Run: `pnpm --filter @repo/marketing build`
Expected: builds green. Then `pnpm --filter @repo/marketing dev` and load `http://localhost:3000` — the techy site looks identical (dark zinc background, indigo accents, Outfit headings). The `body` now reads its colour from the techy token, which equals the old `zinc-950`/`zinc-100`.

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/app/globals.css apps/marketing/tailwind.config.ts
git commit -m "feat(marketing): semantic color + font tokens per variant"
```

---

### Task 3: Variant-aware root layout (fonts, GA, metadata, data-variant)

**Files:**
- Modify: `apps/marketing/app/layout.tsx` (whole file)

**Interfaces:**
- Consumes: `SITE_VARIANT`, `BRAND` from `@/lib/variant` (Task 1); `--font-fraunces` token (Task 2).
- Produces: `<html data-variant>` with per-variant `--font-heading`/`--font-body`, env-driven GA, variant metadata.

- [ ] **Step 1: Replace layout.tsx**

```tsx
import type { Metadata } from "next";
import { Outfit, DM_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_VARIANT, BRAND } from "@/lib/variant";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: BRAND.metaTitle,
  description: BRAND.metaDescription,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headingFont =
    SITE_VARIANT === "calm" ? "var(--font-fraunces)" : "var(--font-outfit)";
  const fontVars = {
    ["--font-heading"]: headingFont,
    ["--font-body"]: "var(--font-dm-sans)",
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      data-variant={SITE_VARIANT}
      className={`${outfit.variable} ${dmSans.variable} ${fraunces.variable}`}
      style={fontVars}
    >
      <head>
        {BRAND.gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${BRAND.gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${BRAND.gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="font-body">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify both variants**

Run: `pnpm --filter @repo/marketing typecheck` → clean.
Run techy: `pnpm --filter @repo/marketing dev` → `http://localhost:3000` unchanged (Outfit headings, GA `G-D03VRT08J9` in page source).
Run calm: stop dev, then `NEXT_PUBLIC_SITE_VARIANT=calm pnpm --filter @repo/marketing dev` → `<html data-variant="calm">` in DOM and body background is warm linen `#f4eee3`.

- [ ] **Step 3: Commit**

```bash
git add apps/marketing/app/layout.tsx
git commit -m "feat(marketing): variant-aware layout — fonts, GA, metadata"
```

---

### Task 4: Calm home copy module

**Files:**
- Create: `apps/marketing/content/home.calm.ts`
- Test: `apps/marketing/content/home.calm.test.ts`

**Interfaces:**
- Produces: `calmHome` object with keys `nav, hero, magic, emailGate, breadth, swipe, pricing, blog, footer`. Consumed by Tasks 5–8.

- [ ] **Step 1: Write the failing test**

```ts
// apps/marketing/content/home.calm.test.ts
import { describe, it, expect } from "vitest";
import { calmHome } from "./home.calm";

describe("calmHome copy", () => {
  it("hero headline is the Taiga tagline", () => {
    expect(calmHome.hero.headline).toBe("Grow your business. Stay calm.");
  });
  it("pricing shows the £49.95 plan", () => {
    expect(calmHome.pricing.price).toBe("£49.95");
  });
  it("breadth lists the five channels", () => {
    expect(calmHome.breadth.items).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/marketing test home.calm`
Expected: FAIL — cannot find module `./home.calm`.

- [ ] **Step 3: Write the copy module**

```ts
// apps/marketing/content/home.calm.ts
export const calmHome = {
  nav: {
    links: ["How it works", "Pricing", "Blog"],
    cta: "Start free",
  },
  hero: {
    eyebrow: "Marketing on autopilot",
    headline: "Grow your business. Stay calm.",
    subline:
      "Drop in your website. Taiga learns your brand and quietly runs your social, ads, email and blog — so you never have to become a marketer.",
    reassurance: "Free brand reveal — no card, no signup to look.",
  },
  magic: {
    eyebrow: "The magic, before you pay",
    heading: "Watch Taiga study your business",
    subline:
      "A calm, live moment — then your brand DNA and audience, generated free.",
    dnaLabel: "Brand DNA",
    audienceLabel: "Your audience",
  },
  emailGate: {
    heading: "Want the rest? Pop in your email.",
    subline:
      "Unlock your full brand kit, sample posts and a content plan — yours to keep, free.",
    placeholder: "you@business.com",
    cta: "Unlock",
  },
  breadth: {
    heading: "One calm place for all of it",
    subline: "Lead with social — but Taiga handles the whole garden.",
    items: [
      { icon: "📱", label: "Social" },
      { icon: "🎯", label: "Ads" },
      { icon: "✉️", label: "Email" },
      { icon: "📝", label: "Blog" },
      { icon: "🔗", label: "Tracked links" },
    ],
  },
  swipe: {
    eyebrow: "Approve in seconds",
    heading: "Tinder for your marketing",
    subline:
      "Taiga drafts everything. You just swipe — keep what you love, bin what you don't. Two minutes a day.",
  },
  pricing: {
    heading: "One price. Everything.",
    price: "£49.95",
    period: "/mo",
    includes: "Social · Ads · Email · Blog · Tracked links · Brand kit · Avatars",
    cta: "Start growing calmly",
  },
  blog: {
    eyebrow: "From the Taiga journal",
    viewAll: "View all posts",
  },
  footer: {
    tagline: "Grow your business, stay calm",
    domain: "gettaiga.com",
  },
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/marketing test home.calm`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/content/home.calm.ts apps/marketing/content/home.calm.test.ts
git commit -m "feat(marketing): Taiga calm home copy module"
```

---

### Task 5: Calm top-funnel sections (nav, hero, magic, email gate)

**Files:**
- Create: `apps/marketing/components/home/calm/calm-nav.tsx`
- Create: `apps/marketing/components/home/calm/calm-hero-url-input.tsx`
- Create: `apps/marketing/components/home/calm/calm-hero.tsx`
- Create: `apps/marketing/components/home/calm/calm-magic.tsx`
- Create: `apps/marketing/components/home/calm/calm-email-gate.tsx`

**Interfaces:**
- Consumes: `calmHome` (Task 4); semantic Tailwind classes (Task 2); `next/navigation`.
- Produces: `CalmNav`, `CalmHero`, `CalmMagic`, `CalmEmailGate` components.

- [ ] **Step 1: Calm URL input (client, reuses /start routing)**

```tsx
// apps/marketing/components/home/calm/calm-hero-url-input.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CalmHeroUrlInput() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) router.push(`/start?url=${encodeURIComponent(url.trim())}`);
      }}
      className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="yourbusiness.com"
        aria-label="Your website address"
        className="flex-1 rounded-full border border-ink/10 bg-surface px-5 py-3 text-sm text-ink placeholder-muted/60 transition-colors focus:border-primary/50 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-paper transition-all hover:opacity-90"
      >
        See your brand come alive →
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Calm nav**

```tsx
// apps/marketing/components/home/calm/calm-nav.tsx
import Link from "next/link";
import { calmHome } from "@/content/home.calm";

export function CalmNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/[0.06] bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-heading text-xl text-ink">🌲 Taiga</span>
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="#how" className="hidden hover:text-ink sm:inline">{calmHome.nav.links[0]}</Link>
          <Link href="#pricing" className="hidden hover:text-ink sm:inline">{calmHome.nav.links[1]}</Link>
          <Link href="/blog" className="hidden hover:text-ink sm:inline">{calmHome.nav.links[2]}</Link>
          <Link href="/start" className="rounded-full bg-primary px-4 py-2 text-paper">{calmHome.nav.cta}</Link>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Calm hero**

```tsx
// apps/marketing/components/home/calm/calm-hero.tsx
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
```

- [ ] **Step 4: Calm magic (forest-green payoff section)**

```tsx
// apps/marketing/components/home/calm/calm-magic.tsx
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
          {["bg-sage", "bg-accent", "bg-birch"].map((b, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full ${b}`} />
              <span className="h-2 flex-1 rounded bg-paper/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Calm email gate**

```tsx
// apps/marketing/components/home/calm/calm-email-gate.tsx
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
```

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm --filter @repo/marketing typecheck`
Expected: clean.

```bash
git add apps/marketing/components/home/calm/calm-nav.tsx apps/marketing/components/home/calm/calm-hero-url-input.tsx apps/marketing/components/home/calm/calm-hero.tsx apps/marketing/components/home/calm/calm-magic.tsx apps/marketing/components/home/calm/calm-email-gate.tsx
git commit -m "feat(marketing): Taiga calm top-funnel sections"
```

---

### Task 6: Calm value sections (breadth, swipe hook)

**Files:**
- Create: `apps/marketing/components/home/calm/calm-breadth.tsx`
- Create: `apps/marketing/components/home/calm/calm-swipe.tsx`

**Interfaces:**
- Consumes: `calmHome` (Task 4); semantic classes (Task 2).
- Produces: `CalmBreadth`, `CalmSwipe`.

- [ ] **Step 1: Calm breadth**

```tsx
// apps/marketing/components/home/calm/calm-breadth.tsx
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
```

- [ ] **Step 2: Calm swipe hook**

```tsx
// apps/marketing/components/home/calm/calm-swipe.tsx
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
```

- [ ] **Step 3: Typecheck + commit**

Run: `pnpm --filter @repo/marketing typecheck` → clean.

```bash
git add apps/marketing/components/home/calm/calm-breadth.tsx apps/marketing/components/home/calm/calm-swipe.tsx
git commit -m "feat(marketing): Taiga calm value sections"
```

---

### Task 7: Calm bottom sections (pricing, blog, footer)

**Files:**
- Create: `apps/marketing/components/home/calm/calm-pricing.tsx`
- Create: `apps/marketing/components/home/calm/calm-blog.tsx`
- Create: `apps/marketing/components/home/calm/calm-footer.tsx`

**Interfaces:**
- Consumes: `calmHome` (Task 4); `fetchArticles` from `@/lib/blog/articles`; `ArticleCard` from `@/components/blog/article-card`.
- Produces: `CalmPricing`, `CalmBlog` (async), `CalmFooter`.

- [ ] **Step 1: Calm pricing**

```tsx
// apps/marketing/components/home/calm/calm-pricing.tsx
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
```

- [ ] **Step 2: Calm blog (reuses existing article data)**

```tsx
// apps/marketing/components/home/calm/calm-blog.tsx
import Link from "next/link";
import { calmHome } from "@/content/home.calm";
import { fetchArticles } from "@/lib/blog/articles";
import { ArticleCard } from "@/components/blog/article-card";

export async function CalmBlog() {
  const articles = await fetchArticles(3);
  if (articles.length === 0) return null;

  return (
    <section className="bg-birch/10 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="font-heading text-2xl text-ink">{calmHome.blog.eyebrow}</h2>
          <Link href="/blog" className="text-sm text-accent hover:opacity-80">
            {calmHome.blog.viewAll} →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

> Note: `ArticleCard` is the existing techy-styled card. Acceptable for this slice; a calm-styled card is a later refinement (flag if its dark styling clashes badly on the linen background — if so, wrap in a `bg-surface` container as a quick fix).

- [ ] **Step 3: Calm footer**

```tsx
// apps/marketing/components/home/calm/calm-footer.tsx
import { calmHome } from "@/content/home.calm";

export function CalmFooter() {
  return (
    <footer className="bg-ink px-6 py-8 text-center text-xs text-sage">
      🌲 Taiga · {calmHome.footer.tagline} · {calmHome.footer.domain}
    </footer>
  );
}
```

- [ ] **Step 4: Typecheck + commit**

Run: `pnpm --filter @repo/marketing typecheck` → clean.

```bash
git add apps/marketing/components/home/calm/calm-pricing.tsx apps/marketing/components/home/calm/calm-blog.tsx apps/marketing/components/home/calm/calm-footer.tsx
git commit -m "feat(marketing): Taiga calm bottom sections"
```

---

### Task 8: Compose calm home + variant routing

**Files:**
- Create: `apps/marketing/components/home/calm/calm-home.tsx`
- Modify: `apps/marketing/app/page.tsx` (whole file)

**Interfaces:**
- Consumes: all calm sections (Tasks 5–7); `SITE_VARIANT` (Task 1).
- Produces: `CalmHome`; variant-switched home route.

- [ ] **Step 1: Compose CalmHome**

```tsx
// apps/marketing/components/home/calm/calm-home.tsx
import { CalmNav } from "./calm-nav";
import { CalmHero } from "./calm-hero";
import { CalmMagic } from "./calm-magic";
import { CalmEmailGate } from "./calm-email-gate";
import { CalmBreadth } from "./calm-breadth";
import { CalmSwipe } from "./calm-swipe";
import { CalmPricing } from "./calm-pricing";
import { CalmBlog } from "./calm-blog";
import { CalmFooter } from "./calm-footer";

export function CalmHome() {
  return (
    <>
      <CalmNav />
      <main>
        <CalmHero />
        <CalmMagic />
        <CalmEmailGate />
        <CalmBreadth />
        <CalmSwipe />
        <CalmPricing />
        <CalmBlog />
      </main>
      <CalmFooter />
    </>
  );
}
```

- [ ] **Step 2: Variant-switch the home route**

```tsx
// apps/marketing/app/page.tsx
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Showcase } from "@/components/showcase";
import { Problem } from "@/components/problem";
import { Value } from "@/components/value";
import { HowItWorks } from "@/components/how-it-works";
import { Proof } from "@/components/proof";
import { BlogTeaser } from "@/components/blog-teaser";
import { Pricing } from "@/components/pricing";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { SITE_VARIANT } from "@/lib/variant";
import { CalmHome } from "@/components/home/calm/calm-home";

// Revalidate so the blog teaser picks up newly published posts.
export const revalidate = 60;

export default function HomePage() {
  if (SITE_VARIANT === "calm") return <CalmHome />;

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Showcase />
        <Problem />
        <Value />
        <HowItWorks />
        <Proof />
        <BlogTeaser />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify both variants end-to-end**

Run: `pnpm --filter @repo/marketing typecheck` → clean.
Run: `pnpm --filter @repo/marketing build` → green.
Techy: `pnpm --filter @repo/marketing dev` → `http://localhost:3000` is the unchanged techy site.
Calm: `NEXT_PUBLIC_SITE_VARIANT=calm pnpm --filter @repo/marketing dev` → `http://localhost:3000` is the full Taiga home page (linen background, Fraunces headings, Ember accents, all 9 sections, URL input routes to `/start`).

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/components/home/calm/calm-home.tsx apps/marketing/app/page.tsx
git commit -m "feat(marketing): compose Taiga calm home + variant routing"
```

---

## Verification (whole feature)

- [ ] `pnpm --filter @repo/marketing test` — variant + copy tests pass.
- [ ] `pnpm --filter @repo/marketing typecheck` — clean.
- [ ] `pnpm --filter @repo/marketing build` — green.
- [ ] Techy (`SITE_VARIANT` unset): home page visually identical to before; GA `G-D03VRT08J9` present.
- [ ] Calm (`SITE_VARIANT=calm`): Taiga home renders in Ember palette + Fraunces; URL input → `/start?url=`; blog teaser shows real posts; no GA unless `NEXT_PUBLIC_GA_ID` set.
- [ ] No regression in existing `lib/magic/*` tests.

## Deploy notes (ops, not code)

Two Vercel projects pointing at the same repo: techy (existing env) and calm (`NEXT_PUBLIC_SITE_VARIANT=calm`, its own `NEXT_PUBLIC_GA_ID`, domain `gettaiga.com`). Not part of this plan's code tasks.
