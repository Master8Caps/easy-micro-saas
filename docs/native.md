# Native-Inspired Site Upgrade

Tracking doc for upgrading the Marketing Machine marketing site(s), inspired by
[native.no](https://native.no/en/). Living document — update as we ship.

**Status:** 🟢 Stage 2 verified working locally — `magic_leads` table created, marketing
env keys added. ⚠️ Still pending: same env keys in **Vercel** for the deployed site.
**Last updated:** 2026-06-08

---

## 🎯 The vision

Two marketing sites, **one codebase**, two brand variants:

1. **Original / techy** — the current go-to-market-engine feel. **Build this first.**
2. **Calm / Scandinavian** — meditation tone, expressing the tranquility of growing a
   business *without having to become a social-media expert*. Built second.

Both run the same back end (the existing MicroSaaS app) and the same journey — only the
**UI skin, tone, copy, and imagery** differ.

### Architecture (decided 2026-06-05)
- **Option A — env-flag, two deployments.** Same `apps/marketing` code deployed twice with
  `NEXT_PUBLIC_SITE_VARIANT=techy|calm`; each domain points at its own deployment.
- Calm brand name + domain **not chosen yet** → build **variant-ready**, buy the domain later.
- ⚠️ GA ID is currently hardcoded in `apps/marketing/app/layout.tsx` (`G-D03VRT08J9`) — must
  become variant/env-driven so each brand gets its own GA property.

---

## 🏠 The home-page journey (target — like Native)

1. **Enter your URL** → visible "researching your business…" moment (the perceived magic is
   half the product).
2. **Instant payoff:** brand DNA + audience avatars generated live — **free, pre-paywall**.
3. **Email gate:** "give us your email to receive all the good stuff" → captures the lead and
   unlocks the full result.
4. **Convert:** pay **£49.95/mo** → full access to everything already built in the MicroSaaS
   back end (avatars, ads, email, blog, tracked links, website kits, socials).

### Positioning / what we lead with
- **Lead with social:** organic social + **ad-set auto-creation**, and **"Tinder for social
  media"** (swipe-to-approve content queue) as the hero hook.
- Keep the **breadth** in the story (we're not social-only like Native) — social is the
  attention-grabbing front door, not the whole house.
- **Calm tone** as a deliberate differentiator vs. the usual loud SaaS gradient.
- **Sample visuals on the home page** (like Native) — show the product, don't just describe it.

---

## 📋 Stages & checklist

### Stage 1 — Week 1 quick wins (original/techy site) ✅
- [x] New hero message — simplified to "You built it. We market it." + price up front.
      CTAs → `/signup` placeholder. (`apps/marketing/components/hero.tsx`)
- [x] **Pricing section** — `components/pricing.tsx`, one card **£49.95/mo**, everything
      included. Wired into home page between Proof and Pricing/CTA.
- [x] **Surface the blog** — rebuilt navbar (prominent links + Blog at full weight + mobile
      menu + solid CTA) **and** added a 3-latest-posts teaser strip on the home page
      (`components/blog-teaser.tsx`, shared fetch in `lib/blog/articles.ts`).
- [x] Write new copy as **extractable strings/props** (variant-ready `copy` objects).
- [x] **Sample visuals** on the home page — bento showcase right under the hero with 4 code-built
      mockups (Tinder swipe card, content queue, ad set, brand DNA + avatars). Each wrapped in a
      swap-ready `ShowcaseFrame` (`components/showcase/`) — add an `image` to swap in a real
      screenshot later, no other changes.
- Also added: `/signup` placeholder page (`app/signup/page.tsx`) so CTAs don't 404.
- Also done: stopped tracking `*.tsbuildinfo` (gitignore).

**✅ Stage 1 complete.**

**✅ Stage 2 verified (2026-06-08)** — root-caused two config blockers (not code): the marketing
app's `.env.local` was missing `ANTHROPIC_API_KEY`/`RESEND_API_KEY`, and the `magic_leads`
table didn't exist. Both fixed: keys added, table created via migration
`supabase/migrations/00026_magic_leads.sql` (RLS on — service-role only). End-to-end test
(`POST /api/magic/analyze` on a live URL) returns a full result + persists the lead row.
⚠️ The same env keys must still be added in **Vercel** for the deployed marketing site.

### Stage 2 — The "magic" pre-purchase flow (original site)
- [x] **URL scrape/analysis** — `lib/magic/scrape.ts` fetches the submitted URL, extracts
      copy/meta/OG signals, and feeds them to Claude. Social posts are not pulled (deferred).
- [x] **Scraper hardened for ALL site types (2026-06-08)** — was sending JS-only & bot-blocked
      sites straight to "Tell us more". Three fixes: (1) real browser UA/headers + 10s timeout;
      (2) "thin" now counts title/meta/OG as valid signal, so JS-only sites that render only
      `<head>` still generate; (3) **reader fallback** (`r.jina.ai`, optional `JINA_API_KEY`)
      that renders JS + bypasses most bot-walls when the direct fetch is blocked/empty, merged
      with any directly-scraped metadata. Verified live: Product Hunt & Zillow (both 403 our
      direct fetch) now return full results. Only extreme WAFs (Tesla-class) still fall through
      to the description prompt. Covered by `lib/magic/scrape.test.ts`.
- [x] **Decouple anonymous generation** — implemented as a **new, lighter teaser generator**
      (`lib/magic/generate.ts`) in `apps/marketing`; the existing `apps/app` `generateBrain`
      is untouched. Generates brand DNA + audience avatars for an anonymous visitor and
      stashes the result in Supabase (`magic_leads` table).
- [x] **Public "instant result" page** — `/start` flow: hero URL entry → swipe-during-wait
      deck (`components/magic/SwipeDeck.tsx`) → email gate → `Reveal`
      (`components/magic/Reveal.tsx`). Permalink at `/magic/[id]` for sharing.
- [x] **Email capture** wired to the lead store — `POST /api/magic/unlock` records the email
      against the lead row and triggers a Resend welcome email via `lib/magic/email.ts`.

**New routes/modules shipped:**
- `POST /api/magic/analyze` — scrapes URL, generates teaser result, returns `magicId`
- `POST /api/magic/unlock` — records email, unlocks full result, sends welcome email
- `app/start/page.tsx` — `/start` flow orchestrator
- `app/magic/[id]/page.tsx` — `/magic/[id]` permalink
- `lib/magic/` — scrape, generate, store, rate-limit, email, validation modules
- `components/magic/` — SwipeDeck, Reveal, and supporting components
- Hero home-page URL entry updated to drive the `/start` flow

- [x] **Magic flow redesign (2026-06-10)** — from the first real test (automatedpanda.com):
      one-click analyse from the hero (#1); real declared-hex brand colours via
      `lib/magic/colors.ts` (#2); self-paced `StoryCarousel` wait journey replacing the
      broken swipe deck, skippable when ready (#3); code-built branded visuals, no AI
      image calls pre-paywall (#4); "centre stage" Brand DNA layout with the real logo and
      a one-post-at-a-time carousel (#5). See
      `docs/superpowers/plans/2026-06-10-magic-flow-redesign.md`.

- [x] **Magic flow v2 (2026-06-11)** — rebuilt the wait journey (pain-point info screens +
      a forced swipe-left/swipe-right teaching beat, no dead gate, skippable once ready) and
      added **art-directed** AI post images via `gpt-image-1`, generated after email capture
      (`POST /api/magic/visuals`, gated to unlocked leads, stored in the `magic-images` bucket,
      atomic `jsonb_set` persistence) and progressively loaded on the reveal with a gradient
      fallback. Image art direction lives in `lib/magic/image-style.ts` (the quality lever).
      ⚠️ Needs `OPENAI_API_KEY` in the marketing env (local + Vercel) and migrations
      `00027_magic_images_bucket.sql` + `00028_set_magic_post_image.sql` applied. See
      `docs/superpowers/plans/2026-06-10-magic-visuals-and-journey.md`.

### Stage 3 — Conversion + access
- [ ] **Swipe-to-approve queue** ("Tinder for social") — new UI over existing content
      approve/reject states.
- [ ] **Simple Stripe** — embedded subscription **payment link** → grants back-end access.
      NO cancellation gating / access revocation yet (build that at 10+ paying clients).

### Stage 4 — The calm/Scandinavian variant
- [ ] Extract theme tokens (colours, fonts, imagery, copy) behind the variant flag.
- [ ] Build `calm` variant styling + copy + imagery.
- [ ] Buy domain + brand name, set up second deployment with `NEXT_PUBLIC_SITE_VARIANT=calm`.
- [ ] Separate GA property.

---

## ✅ Steal from Native / ⚠️ Don't copy

**Steal:** URL-first onboarding with a visible "researching…" moment · pre-paywall payoff
(DNA + avatars + content queue, free) · swipe-to-approve queue · calm/meditation tone ·
sample visuals on the home page.

**Don't copy:** Native is social-only. We're broader — borrow the mechanic + the calm, keep
our breadth.

---

## ❓ Open questions
- Calm variant: brand name + domain?
- £49.95 CTA target during Stage 1: keep waitlist form / placeholder `/signup` / live Stripe
  payment link?
- Where do captured emails get stored / what receives them?
