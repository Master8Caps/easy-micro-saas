# Magic Flow Redesign — Design

**Date:** 2026-06-10
**Status:** Approved (design) — pending implementation plan
**Context:** First real-world test of the Stage 2 magic flow (brand URL: `automatedpanda.com`)
surfaced five issues. This doc captures the agreed redesign before planning.

Builds on: [`2026-06-05-stage2-magic-flow-design.md`](./2026-06-05-stage2-magic-flow-design.md).

---

## Problem (from the automatedpanda.com test)

1. **Double "Analyse" click.** Typing a URL on the home page then forces a *second* click on
   `/start`. There should be no second click.
2. **Wrong colour palette.** Brand DNA invented colours instead of using the site's real ones.
3. **Swipe deck broken + not a journey.** The wait experience (`SwipeDeck`) is buggy and just
   dumps the result when ready. We want a Native-style interactive journey, skippable when ready.
4. **No visuals generated.** Nothing visual is produced — not for the interactive wait, not for
   the Brand DNA.
5. **Posts use the OG image, not the logo; all shown at once.** Sample posts show the OG image as
   the avatar; we want the real logo, one post at a time with click-through, and a restructured
   Brand DNA page.

---

## Decisions

| # | Decision |
|---|----------|
| 1 | **Auto-analyse on arrival.** When `/start` receives a `url`, fire analysis on mount — skip the input phase. |
| 2 | **Real colours: declared-hex-first, logo as fallback.** Parse exact colours from the site's code; quantize the logo only to supplement. |
| 3 | **Waiting journey: self-paced story carousel** (Option B). Replaces the broken swipe deck. |
| 4 | **Code-built branded graphics.** No AI image calls pre-paywall; render visuals from real brand data. (AI image-gen may be revisited post-paywall.) |
| 5 | **Brand DNA "Centre stage" layout** (Option B) + real logo + one-post-at-a-time carousel. |

---

## 1 · Auto-analyse on arrival

`HeroUrlInput` already routes to `/start?url=…`. The fix is in `StartFlow`:

- When `initialUrl` is non-empty on mount, transition straight to `analysing` and call
  `analyse(initialUrl)` — do **not** render the `input` phase.
- The `input` phase is retained only for direct `/start` visits with no URL.
- `needsDescription` still works: if analysis can't read enough, fall back to that phase.

**Result:** one click from the home page into the journey.

---

## 2 · Real brand colours — `lib/magic/colors.ts`

New module, ordered by accuracy. The goal is *exact* declared colours wherever possible.

1. **Declared colours (exact, primary signal).**
   - CSS custom properties in `:root`/`*` — `--primary`, `--brand`, `--accent`, `--color-*`,
     `--bg`, etc. These are the intentional brand hex codes (what you see in inspect-element).
   - `<meta name="theme-color">`.
   - Inline `style="color/background:#…"` on prominent elements.
2. **Frequency tally (accents).** Collect all hex/`rgb()`/`hsl()` values from linked stylesheets +
   `<style>` blocks; count occurrences; **drop near-white, near-black, and low-saturation greys**;
   keep the top distinct accents.
3. **Logo quantization (supplement / fallback only).** If declared + tallied colours are sparse,
   download the logo/favicon and extract dominant colours.
   - This step is **optional** — if it needs a heavy image dependency (`sharp`/`node-vibrant`),
     prefer a lightweight pure-JS quantizer or skip it. Lib choice deferred to the plan; lean
     toward zero new heavy deps since declared colours usually suffice.

**Output:** an ordered `string[]` of hex colours (most-brand-defining first), attached to
`BrandSignals` as `palette` (or `colors`).

**Feed to Claude as authoritative.** Update the prompt in `generate.ts`:
> "These ARE the brand's colours, extracted from their site: [...]. Use them as the palette —
> order/name them, do not invent new ones. Only choose colours yourself if the list is empty."

`normaliseResult` prefers extracted colours over any Claude-invented palette.

**Fetching note:** stylesheet fetches must respect the same SSRF guards already added in
`scrape.ts` (no internal/metadata hosts), with a timeout and a small cap on stylesheets fetched.

---

## 3 · Waiting journey — `StoryCarousel` (replaces `SwipeDeck`)

New `components/magic/story-carousel.tsx`. Self-paced; user advances with **Next**.

- **Card 1 — Hook:** "Tinder for social" intro.
- **Card 2 — Swipe demo:** a working swipe (approve/skip) over **our own Marketing-Machine branded
  sample posts** — static, code-built, identical for every visitor, so it always works.
- **Card 3 — The full machine:** a peek at ads / email / blog auto-creation, using branded visuals.
- **Finale:** "See your Brand DNA".

**Ready handling (fixes the bug):**
- Analysis runs in the background while the user explores.
- The instant the result is `ready`, a **"Skip to results ✨"** button appears on *any* card.
- If the user reaches the finale before `ready`, the finale shows a calm "Almost there…" state and
  **auto-advances to the email gate when `ready` flips** — no dead end.

`SwipeDeck` is retired (delete file + its references).

---

## 4 · Visuals — code-built branded graphics

No `gpt-image-1` / AI image calls in the pre-paywall flow.

- **Interactive element (journey):** a small set of Marketing-Machine branded sample posts
  (code-built cards: gradient/pattern + MM logo + caption), shown to every visitor in Card 2.
- **Brand DNA posts:** rendered from the **visitor's real data** — their colours (from #2), their
  logo (from #5), and their tone — as gradients/patterns/typographic lockups. Extends the existing
  `BrandedPost` approach; no external image generation.
- Real AI image generation (the app already has `gpt-image-1` wired in `apps/app`) stays reserved
  for the **post-paywall** product, consistent with the image-gen rate-limit plan.

---

## 5 · Brand DNA page — "Centre stage" layout + logo

### Logo vs OG image (extraction fix)
- Split logo from OG image in `scrape.ts` + `types.ts`:
  - `logoUrl` resolution order: `apple-touch-icon` → `icon`/`shortcut icon` → `og:logo` /
    schema.org logo. **Do not** fall back to `og:image` for the logo.
  - `ogImage` stays a separate field (used elsewhere if needed, never as the post avatar).
- `generate.ts` `normaliseResult` no longer assigns `ogImage` to `logoUrl`.

### Layout (Option B — "Centre stage")
Rework `components/magic/reveal.tsx`:
- **Top — `BrandedPostCarousel`** (new component): shows **one post at a time**, large, with the
  **real logo** in the header, plus prev/next arrows and a dot indicator. Code-built branded image
  (colours from #2). Keyboard + click navigation.
- **Beneath — a row of cards:** Brand DNA (name / tagline / palette), Tone of voice, Audience
  avatars, Positioning. Compact, equal-weight cards.
- `branded-post.tsx` updated to use the real `logoUrl` (falls back to a coloured monogram if no
  logo — never the OG image).

---

## Components & files

**New**
- `apps/marketing/lib/magic/colors.ts` — colour extraction (declared-first, logo fallback)
- `apps/marketing/components/magic/story-carousel.tsx` — the waiting journey
- `apps/marketing/components/magic/branded-post-carousel.tsx` — one-at-a-time post viewer
- Marketing-Machine branded sample-post data (for the journey swipe demo)

**Edit**
- `lib/magic/scrape.ts` + `types.ts` — `logoUrl` vs `ogImage`; attach extracted colours to signals
- `lib/magic/generate.ts` — authoritative-palette prompt + `normaliseResult` (logo, palette)
- `components/magic/start-flow.tsx` — auto-analyse on `initialUrl`; wire `StoryCarousel`
- `components/magic/reveal.tsx` — Centre-stage layout
- `components/magic/branded-post.tsx` — real logo, branded code-built image

**Remove**
- `components/magic/swipe-deck.tsx` (replaced by `story-carousel.tsx`)

---

## Testing

- **Unit — colours:** declared CSS vars / `theme-color` extracted exactly; greys/near-white/black
  filtered; ordering sane; empty input → empty (Claude fills). (`colors.test.ts`)
- **Unit — logo precedence:** `apple-touch-icon` chosen over `og:image`; `og:image` never used as
  logo. (extend `scrape.test.ts`)
- **Unit — generate:** extracted palette wins over model-invented colours; `logoUrl` not set from
  `ogImage`. (extend `generate.test.ts`)
- **Component — start-flow:** with `initialUrl`, goes straight to `analysing` (no input phase).
- **Component — story-carousel:** "Skip to results" appears when `ready`; finale auto-advances when
  `ready` flips after reaching it (the old stuck-state bug).
- **Component — carousel:** one post visible at a time; arrows/dots change the post.

---

## Out of scope (deliberately)
- AI image generation in the pre-paywall flow (revisit post-paywall).
- Screenshot-based colour extraction (infra/cost; declared colours suffice).
- Stripe / conversion (Stage 3, unchanged).
- Calm/Scandinavian variant (Stage 4, unchanged).
