# 🌲 Taiga — Launch Checklist

The calm/Scandinavian marketing-site variant. Same codebase as the techy site
(`apps/marketing`), switched by **one env var**. This doc is everything you need
to take it live.

- **Brand:** Taiga · tagline *"Grow your business. Stay calm."*
- **Domain:** `gettaiga.com` (not bought yet)
- **Palette (Ember):** forest green + terracotta on warm linen
- **Architecture:** Option A — **one repo, two Vercel deployments.** The techy site
  and Taiga are the *same code*; Taiga just runs with `NEXT_PUBLIC_SITE_VARIANT=calm`.
- Design spec: `docs/superpowers/specs/2026-06-24-taiga-calm-variant-design.md`
- Plan: `docs/superpowers/plans/2026-06-24-taiga-calm-variant.md`

> **Status:** ✅ Code merged to `main` and building green (techy + calm).
> ⏳ Not deployed yet — the steps below are what's left.

---

## ✅ Done (no action needed)
- Variant system, Ember theming, and full Taiga home page built + merged to `main`.
- Techy site unchanged (it's the default when the flag is unset).
- Both variants build green locally.

---

## 👉 To go live — do these in order

### Step 1 — Finish your local env file *(2 minutes)*
Your `apps/marketing/.env.local` was reconstructed but has **two placeholders**.
Open it and replace:
- [ ] `BLOG_PUBLISH_API_KEY` → your real blog-publish secret *(needed for the blog publisher)*
- [ ] `JINA_API_KEY` → your Jina key *(optional — works blank, just lower rate limits)*

### Step 2 — Push `main` to GitHub *(1 minute)*
Vercel deploys from GitHub, so nothing happens until `main` is pushed.
- [ ] `git push origin main`  *(or ask Claude to do it)*

### Step 3 — Buy the domain *(~£10)*
- [ ] Register **`gettaiga.com`** (Namecheap / Cloudflare / wherever you normally buy).

### Step 4 — Create the **second Vercel project** *(the Taiga deployment)*
Your existing techy marketing project stays exactly as-is. Add a NEW project:
- [ ] **New Project** → import the **same GitHub repo** as the techy site.
- [ ] **Root Directory:** `apps/marketing`
- [ ] **Framework Preset:** Next.js *(same as techy)*
- [ ] **Branch:** `main` *(production)*
- [ ] Add the environment variables in Step 5.
- [ ] Deploy.

### Step 5 — Set the Taiga project's environment variables
Copy the **values** from your existing techy Vercel project (or your
`apps/marketing/.env.local`). The **only** value that differs from techy is the
first one.

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_VARIANT` | `calm` | ⭐ **The switch.** This is what makes it Taiga. |
| `NEXT_PUBLIC_SITE_URL` | `https://gettaiga.com` | The Taiga public URL (canonical links). |
| `NEXT_PUBLIC_APP_URL` | *(same as techy)* | The shared product-app URL. |
| `SUPABASE_URL` | *(same as techy)* | Shared back end — same Supabase project. |
| `SUPABASE_SERVICE_ROLE_KEY` | *(same as techy)* | 🔒 Server-only secret. |
| `BLOG_PUBLISH_API_KEY` | *(same as techy)* | 🔒 Blog publisher auth. |
| `ANTHROPIC_API_KEY` | *(same as techy)* | 🔒 Magic flow (brand DNA generation). |
| `MAGIC_MODEL` | `claude-sonnet-4-6` | Optional — model for the teaser generation. |
| `RESEND_API_KEY` | *(same as techy)* | 🔒 Welcome / Brand DNA email. |
| `OPENAI_API_KEY` | *(same as techy)* | 🔒 Magic-flow AI post images. |
| `JINA_API_KEY` | *(same as techy)* | Optional — site-scrape fallback; works blank. |
| `NEXT_PUBLIC_GA_ID` | *(Taiga's own GA — see Step 7)* | Omit for now → analytics simply off. |

> 🔒 = secret, server-only. Set all of these as **Production** (and Preview if you
> want preview deploys to work). Never commit any of these values to git.

### Step 6 — Point the domain at the Taiga project
- [ ] In the Taiga Vercel project → **Settings → Domains** → add `gettaiga.com`.
- [ ] Follow Vercel's DNS instructions at your registrar (A record / nameservers).
- [ ] Confirm HTTPS is issued and the calm site loads.

### Step 7 — *(Optional)* Taiga analytics
- [ ] Create a **separate GA4 property** for Taiga (don't reuse the techy one).
- [ ] Put its Measurement ID in `NEXT_PUBLIC_GA_ID` on the Taiga project, redeploy.
- Until you do this, Taiga runs with **no analytics** — intentional and harmless.

---

## ⚠️ Follow-ups (after launch — not blockers)
- **Real sample visuals.** The "watch it think" cards and blog thumbnails are
  gradient/skeleton placeholders. For the real pre-purchase wow moment, swap in
  proper art-directed imagery (the "no AI slop" bar). Spec it as its own task.
- **Email gate wiring.** The mid-page email gate currently routes into `/start`
  (where email is captured downstream). Direct `magic_leads` capture from the
  gate is a noted later refinement.
- **Calm-specific polish.** A few components reuse techy-neutral chrome; revisit
  once you've seen the live calm site end-to-end.

---

## 🧠 How the switch works (reference)
- `apps/marketing/lib/variant.ts` reads `NEXT_PUBLIC_SITE_VARIANT` (`techy` default,
  `calm` opt-in) and exposes the active brand config.
- `app/layout.tsx` sets `data-variant` on `<html>`, picks the fonts (Fraunces for
  calm), drives GA + page metadata from the brand config.
- Colours are semantic CSS-variable tokens; `[data-variant="calm"]` supplies the
  Ember palette. Calm components use only those tokens.
- `app/page.tsx` renders the Taiga home page when the variant is `calm`, the techy
  home otherwise.
- **To preview calm locally:** `NEXT_PUBLIC_SITE_VARIANT=calm pnpm --filter @repo/marketing dev`
