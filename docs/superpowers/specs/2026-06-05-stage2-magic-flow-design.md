# Stage 2 — URL-first "Magic" Pre-Purchase Flow — Design Spec

**Date:** 2026-06-05
**Status:** Approved design — ready for implementation plan
**Tracking doc:** `docs/native.md` (Stage 2)

## Summary

A public, pre-purchase experience on the marketing site (`apps/marketing`) inspired
by [native.no](https://native.no). A visitor enters their website URL; we analyse the
site to extract its brand identity (logo, colours, tone), then generate a free payoff —
**Brand DNA + 2–3 customer avatars + 3 sample social posts** — rendered in the
visitor's own branding. While the analysis runs, the visitor plays with the
swipe-to-approve ("Tinder for social") mechanic so the wait is engaging. The full
reveal is gated behind an email capture. The final CTA pushes to signup / £49.95.

This is the highest-leverage conversion piece in the Native-inspired roadmap. The heavy
product engine (`generateBrain` in `apps/app`) is **not** reused — Stage 2 is a
separate, lighter "teaser" generation.

## Goals

- Turn an anonymous visitor + a URL into an email lead with a personalised "wow" moment.
- Reflect the visitor's **own brand** (logo, colour palette, tone of voice) back at them
  in the generated examples, like Native.
- Make the unavoidable wait (LLM latency) feel like the fun part via the swipe mechanic.
- Capture the email at the reveal, store the result, and lay a hook for pre-filling the
  brand when the lead later signs up (Stage 3).

## Non-goals (explicitly out of scope for Stage 2)

- Real AI **image generation** for sample posts (Level 3). The free mockups are branded
  with the visitor's palette/logo + AI-written copy only. AI images stay a paid
  in-product feature.
- Reusing or refactoring the product's `generateBrain` pipeline.
- Hard paywall security on the result payload (gate is a soft UX gate in v1).
- Account creation / Stripe (Stage 3). The CTA links to the existing `/signup` placeholder.
- The full campaign machine (queue, scheduling, ads management, content library) — those
  stay behind the paywall.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Free payoff scope | Brand DNA + 2–3 avatars + a taste of content (3 sample posts) |
| Brand fidelity | Level 2 — branded mockups (their colours/logo/tone), **not** AI images |
| Sample-post chrome | Full social chrome: likes, comments, reactions (looks "live") |
| The wait | Interactive — swipe sample posts while analysis runs in the background |
| Email gate position | At the reveal, to unlock (after they're invested from swiping) |
| Engine location | Self-contained in `apps/marketing` |
| Scrape failure | Graceful fallback (use what we got; ask a one-liner if too thin) |

## User journey

1. **Enter URL** — a URL field in the hero ("Enter your website →") routes to `/start?url=`.
2. **Analysing + swipe** — `/start` immediately fires `POST /api/magic/analyze` and shows
   the swipe deck on **canned** sample posts. The analyze promise resolves in the
   background while the visitor swipes (no polling / background jobs).
3. **Email gate** — once analysis is ready and the visitor moves to reveal, an email field
   unlocks the result.
4. **Reveal** — Brand DNA + avatar cards + 3 **branded** social posts (themed by the
   visitor's palette/logo, with engagement chrome).
5. **CTA** — "Unlock the full machine — £49.95/mo" → `/signup?lead=[id]`.
6. **Email** — Resend sends "Here's your Brand DNA" linking to the permalink `/magic/[id]`.

## Architecture

Everything lives in `apps/marketing`, which already has a Supabase service-role client
and Resend configured. Adds the `@anthropic-ai/sdk` dependency.

### Modules (isolated, testable units)

- **`lib/magic/scrape.ts`** — `fetchBrandSignals(url): Promise<BrandSignals>`. Fetches the
  homepage with a browser-like User-Agent and ~8s timeout. Extracts: `title`, meta/og
  description, `og:image` (logo candidate), `theme-color` + favicon/apple-touch-icon
  (palette/logo hints), headings, and visible body text (scripts/styles stripped,
  truncated to a sane max). Returns a `BrandSignals` object and a `thin: boolean` flag
  when content is too sparse to generate well. Pure aside from the single fetch.

- **`lib/magic/generate.ts`** — `generateMagicResult(signals, description?): Promise<MagicResult>`.
  One Claude call (Sonnet, model id from env, default to current Sonnet). Prompt instructs
  Claude to return strict JSON. Parses, validates shape, returns `MagicResult`. Accepts an
  injected Anthropic client for testing.

- **`lib/magic/store.ts`** — Supabase read/write for `magic_leads`:
  `createLead(sourceUrl, result): id`, `attachEmail(id, email)`, `getLead(id)`,
  `findRecentResultByUrl(url): result | null` (returns only the cached generation, not the
  lead row, so a fresh per-visitor row is always created).

- **`lib/magic/validation.ts`** — `normaliseUrl(raw)` (add scheme, validate host) and
  email validation (reuse the existing regex from the waitlist route).

### API routes

- **`POST /api/magic/analyze`** — body `{ url, description? }`.
  1. Normalise/validate URL.
  2. Per-IP daily cap check. URL dedupe — if a recent lead exists for the URL, reuse its
     **generated `result`** (skips the scrape + Claude cost) but still create a fresh lead
     row in step 5, so each visitor gets their own `id`/email and visitors can't collide on
     one row.
  3. `fetchBrandSignals` (skipped on dedupe hit). If `thin` and no `description` supplied →
     respond `{ needsDescription: true }`.
  4. `generateMagicResult` (one retry on failure; skipped on dedupe hit).
  5. `createLead` (anonymous, `email = null`) with the fresh-or-reused `result`.
  6. Respond `{ id, result }`.

- **`POST /api/magic/unlock`** — body `{ id, email }`. Validates email, `attachEmail`,
  fires the Resend email (fire-and-forget, errors logged), responds `{ success: true }`.

### Pages & components

- **`app/start/page.tsx`** + a client orchestrator component — drives the state machine:
  `input → analysing(+swipe) → emailGate → reveal`. Reads `?url=` to auto-start.
- **`app/magic/[id]/page.tsx`** — server component; loads the stored result via
  `getLead` and renders the reveal (read-only permalink for the email link).
- **`components/magic/swipe-deck.tsx`** — the canned swipe interaction (engagement + demo).
- **`components/magic/branded-post.tsx`** — social post mockup with engagement chrome,
  themed by a `brand` prop (palette/logo).
- **`components/magic/brand-dna.tsx`** — voice + palette + positioning.
- **`components/magic/avatar-cards.tsx`** — the 2–3 avatars.
- **Hero change** — add the URL input as the primary entry (kept as extractable strings,
  variant-ready per `docs/native.md`).

### Data types (shape, not final TypeScript)

```
BrandSignals {
  url; title; description; ogImage?; themeColor?; favicon?;
  headings: string[]; text: string; thin: boolean;
}

MagicResult {
  brand: { name; tagline; tone: string[]; palette: string[] /* hex */;
           logoUrl?; positioning };
  avatars: { name; role; painPoints: string[]; channels: string[] }[];
  samplePosts: { platform; caption; hashtags: string[];
                 engagement: { likes; comments; shares } }[];
}
```

### Database

New table (SQL handed to James to run — `supabase/migrations/` is gitignored):

```sql
create table magic_leads (
  id          uuid primary key default gen_random_uuid(),
  email       text,                       -- null until unlock
  source_url  text not null,
  result      jsonb not null,
  created_at  timestamptz not null default now()
);
create index magic_leads_email_idx on magic_leads (email);
create index magic_leads_source_url_idx on magic_leads (source_url);
```

## Error handling

- **Invalid URL** — validated/normalised client- and server-side; friendly inline error.
- **Scrape blocked / JS-only / thin** — graceful fallback: `analyze` returns
  `needsDescription:true`; the client shows a one-line "what does your business do?" input
  and re-runs `analyze` with it. Never a dead end.
- **Claude failure** — one automatic retry, then a friendly "couldn't build it — try again"
  with a retry button. The swipe UI keeps the user occupied until resolution.
- **Resend failure** — logged, non-blocking (the reveal still shows; the result is also at
  the permalink).

## Cost & abuse control

Anonymous LLM calls cost real money and are abusable. v1 guards:

- **URL dedupe** — re-analysing the same URL returns the stored result (cost + speed win).
- **Per-IP daily cap** — a simple ceiling on `analyze` calls per IP per day.
- **Input bounds** — scraped text truncated before being sent to Claude.

Heavier protections (CAPTCHA, stricter rate limits) deferred until there's real traffic —
consistent with the project's "build protection when there are paying clients" stance
(see `docs/native.md`, `project_image_gen_rate_limits`).

## Testing

The marketing app has no test runner yet; add **Vitest** for the `lib/magic` units:

- `scrape.ts` — against HTML fixtures: full og tags, missing og tags, blocked/empty (asserts
  `thin`), malformed HTML.
- `generate.ts` — with a **mocked Anthropic client** returning canned JSON: asserts parse +
  shape; asserts the retry path on a first-call failure.
- `validation.ts` — URL normalisation + email validation cases.

Presentational components are dumb (props in → markup out) and covered by manual review +
the visual companion mockups already approved.

## Future hooks (not built now)

- **Signup pre-fill (Stage 3)** — on signup, look up `magic_leads` by email and seed the
  product/brand so the paid onboarding starts from the free result.
- **Payload hardening** — withhold avatars/posts from `analyze`, serve only via `unlock`,
  if soft-gate abuse becomes a problem.
- **AI image generation** for branded posts as a paid in-product feature.

## Open questions

None blocking. Model id and per-IP cap value are configuration, finalised during
implementation.
