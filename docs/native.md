# Native-Inspired Site Upgrade

Tracking doc for upgrading the Marketing Machine marketing site(s), inspired by
[native.no](https://native.no/en/). Living document — update as we ship.

**Status:** 🟡 Planning → starting Week 1 quick wins on the **original (techy)** site.
**Last updated:** 2026-06-05

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

### Stage 1 — Week 1 quick wins (original/techy site) ← **WE ARE HERE**
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

**✅ Stage 1 complete.** Next: Stage 2 (the URL-first "magic" pre-purchase flow) — see below.

### Stage 2 — The "magic" pre-purchase flow (original site)
- [ ] **URL scrape/analysis** — fetch page, extract copy/meta, feed to Claude. (New. Fiddly:
      anti-scraping, JS-rendered pages.) Optional: pull recent social posts for voice.
- [ ] **Decouple `generateBrain`** from authed user + saved product row → generate for an
      anonymous, email-gated visitor and stash temporarily.
- [ ] **Public "instant result" page** — "watch it think → here's your DNA + avatars" with
      email capture.
- [ ] **Email capture** wired to the lead store.

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
