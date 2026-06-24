# Taiga — Calm Marketing-Site Variant (Design Spec)

**Date:** 2026-06-24
**Status:** Draft for review
**Related:** `docs/native.md`, memory `project-marketing-two-site-variants`, `project-native-inspired-roadmap`

---

## 1. Summary

Ship a second brand variant of `apps/marketing` — **Taiga** — a calm, Scandinavian
"northern-forest" expression of the same product and the same back end. One codebase,
two deployments, switched by an env flag (**Option A**, already decided). The existing
**techy** site is unchanged and stays the default.

**Today's scope (this spec):**
1. **Theming foundation** — the variant system: env resolution, semantic design tokens,
   per-variant fonts, a copy layer, and env-driven analytics.
2. **The Taiga home page** — built end-to-end in the approved Ember palette and approved
   section flow.

**Explicitly out of scope for now:** calm versions of other pages (blog, magic-flow
internals, signup), real Stripe billing, buying the domain. Those follow later.

---

## 2. Brand decisions (locked)

- **Name:** Taiga 🌲 (the boreal forest — calm, patient, organic growth; embeds "ai").
- **Default domain:** `gettaiga.com` (`gettaiga.io` also held; bare `taiga.*` all taken).
- **Tagline:** "Grow your business. Stay calm."
- **Palette — "Ember"** (forest green + terracotta on warm linen):
  | Token | Hex | Role |
  |---|---|---|
  | `paper` | `#F4EEE3` | page background (warm linen) |
  | `ink` | `#1F2C24` | primary text (deep pine) |
  | `primary` | `#2F4A3C` | forest green — buttons, dark sections |
  | `sage` | `#88A38B` | secondary / muted green |
  | `accent` | `#C0623E` | ember terracotta — sparing highlights, key CTAs |
  | `birch` | `#C2A878` | warm wheat — tertiary / illustration |
  | `surface` | `#FFFFFF` | cards |
  | `muted` | `#4A574C` | secondary text |
- **Type:** editorial serif headings (**Fraunces**), clean humanist body
  (**DM Sans**, already loaded — reused to avoid extra font weight). Techy keeps
  Outfit + DM Sans.

---

## 3. Architecture — the variant system

### 3.1 Variant resolution
New module `apps/marketing/lib/variant.ts`:
- Reads `NEXT_PUBLIC_SITE_VARIANT` → `"techy" | "calm"`, **defaulting to `"techy"`**
  (so nothing changes for the existing site if the env var is absent).
- Exports `SITE_VARIANT` and a `BRAND` config object keyed by variant:
  name, domain, tagline, GA measurement ID, metadata title/description, font choice.
- One source of truth; no scattered `process.env` reads.

### 3.2 Design tokens (the core change)
Colours become **semantic CSS variables**, defined per-variant and consumed through
Tailwind semantic color names instead of raw `zinc`/`indigo` classes.

- In `globals.css`, define token values under a selector switch:
  `:root` / `[data-variant="techy"]` (current dark values) and `[data-variant="calm"]`
  (the Ember values above).
- `<html>` gets `data-variant={SITE_VARIANT}` in `layout.tsx`.
- Extend the shared Tailwind preset (`@repo/ui/tailwind-preset`) with semantic colors that
  read the vars: `bg-paper`, `text-ink`, `bg-primary`, `text-accent`, `bg-surface`,
  `text-muted`, etc. (`colors.paper = "var(--color-paper)"` …).
- **Techy mapping:** the existing dark palette is expressed as the techy token set so the
  current site renders identically — verified by eye + existing visual.

> This is the bulk of "configure the repo properly": moving from hardcoded color classes
> to a semantic token layer that both variants drive. Done once, every future variant is
> just a token block + copy block.

### 3.3 Fonts per variant
`layout.tsx` loads the variant's fonts via `next/font/google` and sets the CSS-var
classes. Calm → Fraunces (`--font-heading`) + DM Sans (`--font-body`). Techy → unchanged.

### 3.4 Copy layer
Home-page copy strings extracted into `apps/marketing/content/home.<variant>.ts`
(or one keyed module). Components import copy from the active variant — no hardcoded
marketing prose in JSX. (Several components already note this intent in comments.)

### 3.5 Analytics
Replace the hardcoded `GA_MEASUREMENT_ID` with `BRAND.gaId` (env-driven per deployment),
so each variant reports to its own GA property. Absent ID → GA scripts omitted (safe local).

### 3.6 Home-page composition (techy vs calm)
The techy home sections are bespoke dark components; forcing them to also render calm via
tokens would be messy. Instead, **section components are variant-selected**:
- `page.tsx` renders a `<Home />` that picks the section set by `SITE_VARIANT`.
- Calm sections are authored fresh under `components/home/calm/` (or `*.calm.tsx`),
  sharing any data/server logic with techy (no duplicated back-end calls).
- Techy keeps its current components untouched.

**Recommendation flagged for review:** variant-selected section components (above) over
one set of deeply-conditional components. Cleaner, lower regression risk, and each variant
stays readable. Trade-off: some structural duplication between the two home pages — acceptable,
since the calm layout genuinely differs.

---

## 4. The Taiga home page (approved flow)

Top → bottom, all in the Ember palette:

1. **Nav** — Taiga wordmark; How it works · Pricing · Blog; "Start free" pill.
2. **Hero** — "Grow your business. Stay calm." + sub; **URL-first input**
   ("yourbusiness.com" → "See your brand come alive →"); reassurance line
   ("Free brand reveal — no card, no signup to look").
3. **Watch-it-think magic** (forest-green section) — the live, calm "studying your
   business" moment → free **Brand DNA** + **audience** cards. Pre-paywall payoff.
4. **Email gate** — "Want the rest? Pop in your email." → unlock full brand kit / samples.
5. **Breadth** — "One calm place for all of it": Social · Ads · Email · Blog · Tracked links.
6. **Swipe hook** — "Tinder for your marketing": draft → swipe to approve. Calm card visual.
7. **Pricing** — single card, **£49.95/mo**, everything included.
8. **Blog** — "From the Taiga journal": 3 latest posts (reuses existing blog data/API).
9. **Footer** — calm, minimal; "Grow your business, stay calm · gettaiga.com".

Section order, copy direction, and palette were validated visually with the user
(brainstorm companion) and approved.

### Behaviour notes
- Hero URL input and the magic moment ride on the **existing** magic-flow back end
  (URL → brand DNA + avatars), already built for the techy site — calm reskins it,
  no new generation engine.
- Pricing is **"show the price"** only at this stage; the CTA points at the existing
  signup/payment path. No billing work here (per roadmap: keep Stripe simple later).
- Blog teaser reuses the existing `/blog` data source and 3-latest-posts pattern.
- Any sample imagery must meet the house art-direction bar (memory
  `feedback-ai-images-quality`) — no generic AI slop. Placeholder gradients until real
  art-directed assets exist.

---

## 5. Units & boundaries

| Unit | Purpose | Depends on |
|---|---|---|
| `lib/variant.ts` | Resolve variant + brand config | env |
| token layer (`globals.css` + preset) | Semantic colors per variant | `data-variant` |
| `content/home.*.ts` | Variant copy strings | — |
| calm home sections | Render the Taiga page | tokens, copy, magic back end |
| `layout.tsx` | Set variant attr, fonts, GA | `lib/variant.ts` |

Each is independently understandable and swappable: a future variant = new token block +
new copy file + (optionally) new section set, with no changes to back-end or data flow.

---

## 6. Testing & verification

- **Regression (techy):** with no env var / `SITE_VARIANT=techy`, the existing site renders
  visually unchanged (manual check + existing build/tests stay green).
- **Calm render:** `SITE_VARIANT=calm` renders the Taiga home page with Ember tokens + Fraunces.
- **Token isolation:** no raw `zinc-*`/`indigo-*` color classes remain in shared home markup
  that should be tokenized (grep check).
- **Build:** `@repo/marketing` builds green in both variant modes.
- **GA:** correct measurement ID injected per variant; omitted when unset.

---

## 7. Risks / open questions

- **Token refactor blast radius:** retokenizing the techy site's colors is the riskiest part;
  mitigate by mapping techy tokens to exactly today's values and verifying no visual diff.
- **Font choice:** Fraunces proposed for headings — confirm during spec review (alt: Newsreader).
- **Component duplication:** accepted trade-off (§3.6) — flag if you'd prefer fully shared
  tokenized components instead.
- **Deploy config** (two Vercel projects + env per domain) is noted but is an ops step, not
  code in this slice.
