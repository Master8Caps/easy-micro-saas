# Magic Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the five issues from the automatedpanda.com test — one-click analyse, real declared-hex brand colours, a self-paced "story carousel" wait journey, code-built branded visuals, and a "centre stage" Brand DNA layout with the real logo and a one-post-at-a-time carousel.

**Architecture:** All work is in `apps/marketing`. Pure logic (colour extraction, logo precedence, the authoritative-palette prompt, carousel navigation) lives in `lib/magic/` and is TDD-tested with Vitest (node env). React components in `components/magic/` consume those tested helpers and are verified by `pnpm typecheck` + a manual dev run, matching the existing codebase (which has no component tests).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind, Vitest 4, Anthropic SDK. No new dependencies.

**Spec:** [`docs/superpowers/specs/2026-06-10-magic-flow-redesign-design.md`](../specs/2026-06-10-magic-flow-redesign-design.md)

**Conventions:**
- All commands run from `C:\Users\James\OneDrive\Documents\Marketing Machine\apps\marketing` unless noted.
- Run a single test file: `pnpm exec vitest run lib/magic/<file>.test.ts`
- Run all marketing tests: `pnpm test`
- Typecheck: `pnpm typecheck` · Lint: `pnpm lint` · Build: `pnpm build`
- Branch is already `feat/magic-flow-redesign`.

---

## File Structure

**New**
- `lib/magic/colors.ts` — pure colour extraction from CSS/HTML (declared-first, frequency tally, grey filtering)
- `lib/magic/colors.test.ts` — tests for the above
- `lib/magic/carousel.ts` — pure index navigation helpers shared by both carousels
- `lib/magic/carousel.test.ts` — tests for the above
- `lib/magic/journey-cards.ts` — Marketing-Machine branded sample posts (data) for the wait journey
- `components/magic/story-carousel.tsx` — the self-paced wait journey (replaces SwipeDeck)
- `components/magic/branded-post-carousel.tsx` — one-post-at-a-time viewer with arrows + dots

**Modify**
- `lib/magic/types.ts` — add `logoUrl` and `palette` to `BrandSignals`
- `lib/magic/scrape.ts` — extract real logo separately from `ogImage`; attach `palette`; fetch linked stylesheets for colours
- `lib/magic/scrape.test.ts` — logo precedence + palette tests
- `lib/magic/generate.ts` — authoritative-palette prompt; `normaliseResult` uses `signals.logoUrl` + `signals.palette`
- `lib/magic/generate.test.ts` — update logo assertion; add palette-wins test
- `components/magic/start-flow.tsx` — auto-analyse on `initialUrl`; render `StoryCarousel`
- `components/magic/reveal.tsx` — "centre stage" layout
- `components/magic/branded-post.tsx` — real logo (never OG image), monogram fallback
- `docs/native.md` — note the redesign

**Remove**
- `components/magic/swipe-deck.tsx` (replaced by `story-carousel.tsx`)

---

## Task 1: Logo vs OG image in scrape

Separate the real logo from the OG image so the post avatar stops using the OG image.

**Files:**
- Modify: `lib/magic/types.ts`
- Modify: `lib/magic/scrape.ts`
- Test: `lib/magic/scrape.test.ts`

- [ ] **Step 1: Add `logoUrl` to `BrandSignals`**

In `lib/magic/types.ts`, add the field to the `BrandSignals` interface (just after `ogImage?`):

```ts
export interface BrandSignals {
  url: string;
  title: string;
  description: string;
  ogImage?: string;
  /** The brand's real logo (apple-touch-icon → icon → og:logo). Never the OG image. */
  logoUrl?: string;
  themeColor?: string;
  favicon?: string;
  headings: string[];
  text: string;
  /** Declared/extracted brand colours, most brand-defining first. */
  palette?: string[];
  /** True when the page yielded too little to generate well. */
  thin: boolean;
}
```

- [ ] **Step 2: Write the failing test for logo precedence**

Add to `lib/magic/scrape.test.ts` inside the `describe("extractSignals", ...)` block:

```ts
  it("prefers apple-touch-icon as the logo over og:image", () => {
    const html = `<html><head>
      <title>Acme Ltd — tools for makers</title>
      <meta property="og:image" content="/og-banner.png">
      <link rel="apple-touch-icon" href="/touch-icon.png">
      <link rel="icon" href="/favicon.ico">
    </head><body><h1>Hello makers everywhere</h1></body></html>`;
    const s = extractSignals(html, "https://acme.example");
    expect(s.logoUrl).toBe("https://acme.example/touch-icon.png");
    expect(s.ogImage).toBe("https://acme.example/og-banner.png");
  });

  it("falls back to icon then og:logo for the logo, never og:image", () => {
    const onlyOg = `<html><head>
      <title>Beta Co — widgets</title>
      <meta property="og:image" content="/og.png">
    </head><body><h1>Widgets for everyone here</h1></body></html>`;
    const s = extractSignals(onlyOg, "https://beta.example");
    expect(s.logoUrl).toBeUndefined();
    expect(s.ogImage).toBe("https://beta.example/og.png");

    const withOgLogo = `<html><head>
      <title>Beta Co — widgets</title>
      <meta property="og:logo" content="/brand.svg">
      <meta property="og:image" content="/og.png">
    </head><body><h1>Widgets for everyone here</h1></body></html>`;
    const s2 = extractSignals(withOgLogo, "https://beta.example");
    expect(s2.logoUrl).toBe("https://beta.example/brand.svg");
  });
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run lib/magic/scrape.test.ts`
Expected: FAIL — `s.logoUrl` is `undefined` (the field isn't populated yet).

- [ ] **Step 4: Implement `findLogo` and set `logoUrl`**

In `lib/magic/scrape.ts`, add a `findLogo` helper next to `findFavicon`:

```ts
function findLogo(html: string): string | undefined {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  // Priority order of rel values.
  for (const wanted of ["apple-touch-icon", "apple-touch-icon-precomposed"]) {
    for (const tag of links) {
      if (attr(tag, "rel")?.toLowerCase() === wanted) {
        const href = attr(tag, "href");
        if (href) return href;
      }
    }
  }
  // og:logo / schema.org logo as a fallback (never og:image).
  return ogContent(html, "og:logo");
}
```

Then in `extractSignals`, after the `favicon` line, derive the logo (apple-touch-icon → og:logo → `icon`/favicon — but **not** og:image):

```ts
  const favicon = abs(findFavicon(html), url);
  const logoUrl = abs(findLogo(html), url) ?? favicon;
```

And add `logoUrl` to the returned object:

```ts
  return {
    url,
    title,
    description,
    ogImage,
    logoUrl,
    themeColor,
    favicon,
    headings,
    text,
    thin,
  };
```

> Note: `favicon` is an acceptable logo fallback (it's the brand's own icon); `og:image` is not. The two `it("falls back…")` cases above have no favicon, so `logoUrl` stays undefined / uses og:logo as asserted.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run lib/magic/scrape.test.ts`
Expected: PASS (all existing tests still green).

- [ ] **Step 6: Commit**

```bash
git add apps/marketing/lib/magic/types.ts apps/marketing/lib/magic/scrape.ts apps/marketing/lib/magic/scrape.test.ts
git commit -m "feat(magic): extract real logo separately from og:image"
```

---

## Task 2: Colour extraction module (`lib/magic/colors.ts`)

Pure, dependency-free colour extraction. Declared brand colours first, then frequency-ranked accents, greys/near-white/near-black filtered out.

**Files:**
- Create: `lib/magic/colors.ts`
- Test: `lib/magic/colors.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/magic/colors.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { extractColors } from "./colors";

describe("extractColors", () => {
  it("returns declared brand custom-properties first", () => {
    const css = `:root{--primary:#0d9488;--brand-accent:#155e75;--text:#111}`;
    const out = extractColors(css);
    expect(out[0]).toBe("#0d9488");
    expect(out).toContain("#155e75");
  });

  it("expands 3-digit hex and lowercases", () => {
    expect(extractColors(":root{--brand:#0AB}")).toContain("#00aabb");
  });

  it("converts rgb() to hex", () => {
    expect(extractColors(":root{--primary:rgb(13,148,136)}")).toContain("#0d9488");
  });

  it("filters near-white, near-black and greys when real colours exist", () => {
    const css = `:root{--primary:#0d9488}.x{color:#ffffff}.y{background:#000}.z{border:#f5f5f5}`;
    const out = extractColors(css);
    expect(out).toContain("#0d9488");
    expect(out).not.toContain("#ffffff");
    expect(out).not.toContain("#000000");
    expect(out).not.toContain("#f5f5f5");
  });

  it("ranks more frequent colours higher (after declared)", () => {
    const css = `.a{color:#ff0000}.b{color:#00ff00}.c{color:#00ff00}.d{color:#00ff00}`;
    const out = extractColors(css);
    // #00ff00 appears 3×, #ff0000 once → green ranks first
    expect(out.indexOf("#00ff00")).toBeLessThan(out.indexOf("#ff0000"));
  });

  it("returns an empty array when there are no colours", () => {
    expect(extractColors("body{font-size:14px}")).toEqual([]);
  });

  it("caps the result to 5 colours", () => {
    const css = `.a{color:#111abc}.b{color:#22abcd}.c{color:#3abcde}.d{color:#4bcdef}.e{color:#5cdef0}.f{color:#6def01}`;
    expect(extractColors(css).length).toBeLessThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run lib/magic/colors.test.ts`
Expected: FAIL — `Cannot find module './colors'`.

- [ ] **Step 3: Implement `lib/magic/colors.ts`**

```ts
// Pure colour extraction from CSS/HTML text. No network, no dependencies.

const MAX_COLORS = 5;

// CSS custom properties whose name looks brand-defining.
const BRAND_VAR =
  /--[\w-]*(primary|brand|accent|secondary|theme|colou?r|main)[\w-]*\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/gi;
const HEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
const RGB = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, n));
}

function toHex(n: number): string {
  return clamp255(n).toString(16).padStart(2, "0");
}

/** Normalise a raw hex/rgb value to a 6-digit lowercase hex, or null if invalid. */
export function normaliseColor(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  const rgb = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgb) return `#${toHex(+rgb[1])}${toHex(+rgb[2])}${toHex(+rgb[3])}`;
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (!hex) return null;
  const h = hex[1];
  return h.length === 3
    ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
    : `#${h}`;
}

/** True for near-white, near-black, or low-saturation greys — brand noise. */
export function isNeutral(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255) || 1);
  if (lightness > 0.93 || lightness < 0.07) return true; // near white/black
  if (sat < 0.12) return true; // grey
  return false;
}

/**
 * Extract brand colours from CSS (or any text containing CSS).
 * Declared brand custom-properties rank first, then accents by frequency.
 * Near-white/black/grey are dropped (unless nothing else is found).
 */
export function extractColors(css: string): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const c = normaliseColor(raw);
    if (!c || seen.has(c)) return;
    seen.add(c);
    ordered.push(c);
  };

  // 1. Declared brand custom-properties (in source order).
  for (const m of css.matchAll(BRAND_VAR)) push(m[2]);

  // 2. Everything else, ranked by frequency.
  const counts = new Map<string, number>();
  const bump = (raw: string) => {
    const c = normaliseColor(raw);
    if (!c) return;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  };
  for (const m of css.matchAll(HEX)) bump(m[0]);
  for (const m of css.matchAll(RGB)) bump(`rgb(${m[1]},${m[2]},${m[3]})`);

  const byFreq = [...counts.entries()]
    .filter(([c]) => !seen.has(c))
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
  for (const c of byFreq) push(c);

  // Drop neutrals, but keep them if that would empty the list.
  const branded = ordered.filter((c) => !isNeutral(c));
  return (branded.length ? branded : ordered).slice(0, MAX_COLORS);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run lib/magic/colors.test.ts`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/colors.ts apps/marketing/lib/magic/colors.test.ts
git commit -m "feat(magic): add declared-first brand colour extraction"
```

---

## Task 3: Wire colours into scrape (inline + linked stylesheets)

Populate `signals.palette`: from the page's own inline `<style>`/`theme-color` immediately, then enrich by fetching a few same-origin stylesheets.

**Files:**
- Modify: `lib/magic/scrape.ts`
- Test: `lib/magic/scrape.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `lib/magic/scrape.test.ts`. First add the import at the top (extend the existing import line):

```ts
import { extractSignals, fetchBrandSignals } from "./scrape";
```

(unchanged — just confirming). Then add inside `describe("extractSignals", ...)`:

```ts
  it("populates palette from inline <style> and theme-color", () => {
    const html = `<html><head>
      <title>Teal Co — calm tools for teams</title>
      <meta name="theme-color" content="#0d9488">
      <style>:root{--brand:#155e75}.btn{background:#0d9488}</style>
    </head><body><h1>Calm tools for busy teams</h1></body></html>`;
    const s = extractSignals(html, "https://teal.example");
    expect(s.palette).toContain("#0d9488");
    expect(s.palette).toContain("#155e75");
  });
```

And add inside `describe("fetchBrandSignals", ...)`:

```ts
  it("enriches palette by fetching a linked stylesheet", async () => {
    const html = `<html><head>
      <title>Teal Co — calm tools for teams</title>
      <link rel="stylesheet" href="/styles.css">
    </head><body><h1>Calm tools for busy teams</h1>
      <p>Plenty of body copy here, long enough to clear the thin threshold easily.</p>
    </body></html>`;
    const cssText = `:root{--primary:#0d9488;--accent:#f97316}`;
    vi.stubGlobal(
      "fetch",
      vi.fn((u: string) =>
        String(u).endsWith("/styles.css")
          ? Promise.resolve({ ok: true, text: () => Promise.resolve(cssText) })
          : Promise.resolve({ ok: true, text: () => Promise.resolve(html) }),
      ),
    );
    const s = await fetchBrandSignals("https://teal.example");
    expect(s.palette).toContain("#0d9488");
    expect(s.palette).toContain("#f97316");
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run lib/magic/scrape.test.ts`
Expected: FAIL — `s.palette` is `undefined`.

- [ ] **Step 3: Set palette in `extractSignals`**

In `lib/magic/scrape.ts`, add the import at the top:

```ts
import { extractColors } from "./colors";
```

In `extractSignals`, after computing `themeColor`, build the palette from the HTML's own CSS + theme-color:

```ts
  const themeColor = metaContent(html, "theme-color");
  const inlineColors = extractColors(html);
  const palette = themeColor
    ? [themeColor.toLowerCase(), ...inlineColors.filter((c) => c !== themeColor.toLowerCase())]
    : inlineColors;
```

Add `palette` to the returned object (alongside `logoUrl` from Task 1):

```ts
    logoUrl,
    themeColor,
    favicon,
    palette,
    headings,
    text,
    thin,
```

- [ ] **Step 4: Add same-origin stylesheet fetching + run it in `fetchBrandSignals`**

Add these helpers near the top of `scrape.ts` (after the existing constants):

```ts
const MAX_STYLESHEETS = 3;
const CSS_TIMEOUT_MS = 6000;

function findStylesheetHrefs(html: string, base: string): string[] {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  const hrefs: string[] = [];
  for (const tag of links) {
    if (attr(tag, "rel")?.toLowerCase() !== "stylesheet") continue;
    const href = abs(attr(tag, "href"), base);
    // Same-origin only — reuses our SSRF posture (no off-site/internal fetches).
    if (href && new URL(href).origin === new URL(base).origin) hrefs.push(href);
  }
  return hrefs.slice(0, MAX_STYLESHEETS);
}

async function fetchCssColors(html: string, base: string): Promise<string[]> {
  const hrefs = findStylesheetHrefs(html, base);
  const sheets = await Promise.all(
    hrefs.map(async (href) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CSS_TIMEOUT_MS);
        const res = await fetch(href, {
          headers: { "User-Agent": UA },
          signal: controller.signal,
        });
        clearTimeout(timer);
        return res.ok ? await res.text() : "";
      } catch {
        return "";
      }
    }),
  );
  return extractColors(sheets.join("\n"));
}
```

> The same-origin check relies on the route already rejecting internal/metadata hosts before we reach here (the existing SSRF guard in the analyze path), and only fetches stylesheets on the same origin as the user-submitted page.

`extractSignals` doesn't have the raw HTML available to `fetchBrandSignals` after it returns, so capture colours in the direct-fetch path. Update `fetchDirect` to also fetch CSS colours and merge them into the palette before returning:

In `fetchDirect`, replace `return extractSignals(html, url);` with:

```ts
    const signals = extractSignals(html, url);
    if (!signals.thin) {
      const cssColors = await fetchCssColors(html, url);
      const merged = [...(signals.palette ?? [])];
      for (const c of cssColors) if (!merged.includes(c)) merged.push(c);
      signals.palette = merged.slice(0, 5);
    }
    return signals;
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec vitest run lib/magic/scrape.test.ts`
Expected: PASS. (Existing `fetchBrandSignals` tests still pass — their stubbed pages have no `<link rel="stylesheet">`, so `fetchCssColors` fetches nothing and returns `[]`.)

- [ ] **Step 6: Run the full lib suite to confirm nothing regressed**

Run: `pnpm test`
Expected: PASS — all `lib/**/*.test.ts` green.

- [ ] **Step 7: Commit**

```bash
git add apps/marketing/lib/magic/scrape.ts apps/marketing/lib/magic/scrape.test.ts
git commit -m "feat(magic): populate brand palette from inline + linked CSS"
```

---

## Task 4: Authoritative palette + real logo in generate

Feed the extracted palette to Claude as authoritative, and stop assigning `ogImage` to `logoUrl`.

**Files:**
- Modify: `lib/magic/generate.ts`
- Test: `lib/magic/generate.test.ts`

- [ ] **Step 1: Update the failing tests**

In `lib/magic/generate.test.ts`:

1. Extend the `SIGNALS` fixture (add `logoUrl` and `palette`):

```ts
const SIGNALS: BrandSignals = {
  url: "https://northwind.com",
  title: "Northwind",
  description: "Reclaim your weekends.",
  ogImage: "https://northwind.com/og-banner.png",
  logoUrl: "https://northwind.com/logo.png",
  themeColor: "#10b981",
  palette: ["#10b981", "#0f766e"],
  headings: ["Work less, live more"],
  text: "Northwind automates the boring parts.",
  thin: false,
};
```

2. Replace the first test's logo assertion so it asserts the real logo (not the OG banner):

```ts
  it("parses valid JSON and fills logoUrl from the real logo (not og:image)", async () => {
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(VALID_JSON));
    expect(result.brand.name).toBe("Northwind");
    expect(result.brand.logoUrl).toBe("https://northwind.com/logo.png");
    expect(result.brand.logoUrl).not.toBe(SIGNALS.ogImage);
    expect(result.avatars).toHaveLength(1);
    expect(result.samplePosts[0].platform).toBe("Instagram");
  });
```

3. Add a palette-wins test. The `VALID_JSON` model output has `palette: ["#10b981", "#34d399"]`; the extracted `SIGNALS.palette` is `["#10b981", "#0f766e"]`. Assert the extracted palette wins:

```ts
  it("prefers the extracted palette over the model's invented colours", async () => {
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(VALID_JSON));
    expect(result.brand.palette).toEqual(["#10b981", "#0f766e"]);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run lib/magic/generate.test.ts`
Expected: FAIL — `logoUrl` currently comes from `ogImage`, and `palette` currently echoes the model output.

- [ ] **Step 3: Update `buildMagicPrompt` to pass the palette as authoritative**

In `lib/magic/generate.ts`, in `buildMagicPrompt`, replace the theme-colour line with a palette line:

```ts
${signals.palette?.length ? `- Brand colours (EXTRACTED FROM THEIR SITE — authoritative): ${signals.palette.join(", ")}` : signals.themeColor ? `- Theme colour: ${signals.themeColor}` : ""}
```

And change instruction 1 so Claude uses, not invents, colours:

```ts
1. Infer the brand: name, a short tagline, 2-3 tone-of-voice adjectives. For the palette, USE the extracted brand colours above verbatim if present (you may reorder them); only invent a tasteful palette if none were provided.
```

- [ ] **Step 4: Update `normaliseResult` for palette + logo precedence**

Replace the `palette` and `logoUrl` lines in `normaliseResult`:

```ts
      palette: signals.palette?.length
        ? signals.palette
        : raw.brand?.palette?.length
          ? raw.brand.palette
          : [signals.themeColor || "#6366f1", "#a78bfa"],
      logoUrl: raw.brand?.logoUrl || signals.logoUrl,
```

> `signals.logoUrl` already excludes `og:image` (Task 1), so the OG image can no longer become the logo.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec vitest run lib/magic/generate.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/marketing/lib/magic/generate.ts apps/marketing/lib/magic/generate.test.ts
git commit -m "feat(magic): use extracted palette + real logo in generation"
```

---

## Task 5: Carousel navigation helper

Tiny pure helpers shared by both the story carousel and the post carousel.

**Files:**
- Create: `lib/magic/carousel.ts`
- Test: `lib/magic/carousel.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/magic/carousel.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { nextIndex, prevIndex } from "./carousel";

describe("carousel navigation", () => {
  it("advances but clamps at the last index", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(2);
  });
  it("goes back but clamps at zero", () => {
    expect(prevIndex(2, 3)).toBe(1);
    expect(prevIndex(0, 3)).toBe(0);
  });
  it("handles an empty list safely", () => {
    expect(nextIndex(0, 0)).toBe(0);
    expect(prevIndex(0, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run lib/magic/carousel.test.ts`
Expected: FAIL — `Cannot find module './carousel'`.

- [ ] **Step 3: Implement `lib/magic/carousel.ts`**

```ts
/** Clamped (non-wrapping) carousel navigation. */
export function nextIndex(i: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(i + 1, length - 1);
}

export function prevIndex(i: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(i - 1, 0);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run lib/magic/carousel.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/carousel.ts apps/marketing/lib/magic/carousel.test.ts
git commit -m "feat(magic): add shared carousel navigation helpers"
```

---

## Task 6: Branded sample posts data

Marketing-Machine branded sample posts shown to every visitor in the wait journey's swipe beat.

**Files:**
- Create: `lib/magic/journey-cards.ts`
- Test: `lib/magic/journey-cards.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/magic/journey-cards.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { JOURNEY_SAMPLE_POSTS } from "./journey-cards";

describe("JOURNEY_SAMPLE_POSTS", () => {
  it("provides a few complete branded sample posts", () => {
    expect(JOURNEY_SAMPLE_POSTS.length).toBeGreaterThanOrEqual(3);
    for (const p of JOURNEY_SAMPLE_POSTS) {
      expect(p.platform).toBeTruthy();
      expect(p.caption).toBeTruthy();
      expect(p.gradient).toMatch(/^linear-gradient/);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run lib/magic/journey-cards.test.ts`
Expected: FAIL — `Cannot find module './journey-cards'`.

- [ ] **Step 3: Implement `lib/magic/journey-cards.ts`**

```ts
export interface JourneySamplePost {
  platform: string;
  caption: string;
  tag: string;
  /** Code-built background — no image generation needed. */
  gradient: string;
}

/** Marketing-Machine branded sample posts — same for every visitor. */
export const JOURNEY_SAMPLE_POSTS: JourneySamplePost[] = [
  {
    platform: "Instagram",
    caption: "You built it. We market it. ✨",
    tag: "#marketingmachine",
    gradient: "linear-gradient(135deg, #6366f1, #a855f7)",
  },
  {
    platform: "LinkedIn",
    caption: "Your whole funnel — drafted while you sleep.",
    tag: "#growth",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
  },
  {
    platform: "X",
    caption: "Swipe to approve. We post the rest. 🚀",
    tag: "#buildinpublic",
    gradient: "linear-gradient(135deg, #f43f5e, #a855f7)",
  },
  {
    platform: "Instagram",
    caption: "Ads, email, blog, socials — one machine.",
    tag: "#saas",
    gradient: "linear-gradient(135deg, #10b981, #0ea5e9)",
  },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run lib/magic/journey-cards.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/journey-cards.ts apps/marketing/lib/magic/journey-cards.test.ts
git commit -m "feat(magic): add branded sample posts for the wait journey"
```

---

## Task 7: StoryCarousel component (replaces SwipeDeck)

Self-paced wait journey: Next-driven cards, a working swipe beat over branded posts, and a "Skip to results ✨" that appears the moment analysis is ready.

**Files:**
- Create: `components/magic/story-carousel.tsx`
- Test: none (React component — verified by typecheck + manual run, per codebase convention)

- [ ] **Step 1: Implement `components/magic/story-carousel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { nextIndex } from "@/lib/magic/carousel";
import { JOURNEY_SAMPLE_POSTS } from "@/lib/magic/journey-cards";

type Props = {
  /** True once the analysis result is ready. */
  ready: boolean;
  /** Called when the user chooses to see their results. */
  onDone: () => void;
};

// Card sequence: 0 = hook, 1 = swipe beat, 2 = the full machine, 3 = finale.
const LAST_CARD = 3;

export function StoryCarousel({ ready, onDone }: Props) {
  const [card, setCard] = useState(0);
  const [swipeIdx, setSwipeIdx] = useState(0);
  const posts = JOURNEY_SAMPLE_POSTS;
  const post = posts[swipeIdx];

  function advance() {
    setCard((c) => Math.min(c + 1, LAST_CARD));
  }

  function swipe() {
    if (swipeIdx >= posts.length - 1) {
      advance();
      return;
    }
    setSwipeIdx((i) => nextIndex(i, posts.length));
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Skip appears the instant results are ready, on any card. */}
      <div className="mb-4 flex h-8 items-center justify-end">
        {ready && (
          <button
            onClick={onDone}
            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
          >
            Skip to results ✨
          </button>
        )}
      </div>

      {card === 0 && (
        <Card>
          <h2 className="text-2xl font-bold tracking-tight">Meet &ldquo;Tinder for social&rdquo; 🔥</h2>
          <p className="mt-3 text-zinc-400">Approve or bin posts with a swipe — your whole queue, in seconds.</p>
          <NextButton onClick={advance} label="Show me →" />
        </Card>
      )}

      {card === 1 && (
        <Card>
          <p className="mb-4 text-sm text-zinc-400">Try it — swipe a couple while we work ✨</p>
          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-3 shadow-xl">
            <p className="mb-2 text-xs text-zinc-400">{post.platform}</p>
            <div className="h-40 rounded-xl" style={{ background: post.gradient }} />
            <p className="mt-3 text-sm text-zinc-200">{post.caption}</p>
            <p className="mt-1 text-xs text-indigo-300/80">{post.tag}</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <button onClick={swipe} aria-label="Skip" className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">✗</button>
              <button onClick={swipe} aria-label="Approve" className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">♥</button>
            </div>
          </div>
          <NextButton onClick={advance} label="Next →" />
        </Card>
      )}

      {card === 2 && (
        <Card>
          <h2 className="text-2xl font-bold tracking-tight">Not just social</h2>
          <p className="mt-3 text-zinc-400">Ads, email, blog posts and tracked links — auto-created in your brand. Social is just the front door.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {["Ads", "Email", "Blog", "Socials"].map((label, i) => (
              <div key={label} className="rounded-xl border border-white/[0.08] p-4 text-sm text-zinc-300" style={{ background: JOURNEY_SAMPLE_POSTS[i].gradient, opacity: 0.9 }}>{label}</div>
            ))}
          </div>
          <NextButton onClick={advance} label="Almost there →" />
        </Card>
      )}

      {card === 3 && (
        <Card>
          {ready ? (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Your Brand DNA is ready ✨</h2>
              <p className="mt-3 text-zinc-400">Let&apos;s take a look.</p>
              <NextButton onClick={onDone} label="See my Brand DNA →" />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight">Almost there…</h2>
              <p className="mt-3 text-zinc-400">We&apos;re finishing your brand analysis. This jumps in automatically the moment it&apos;s done.</p>
              <div className="mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" />
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="text-center">{children}</div>;
}

function NextButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (no type errors). Note: `start-flow.tsx` still imports `SwipeDeck` — that's fixed in Task 8. If typecheck flags only that, continue; it's resolved next task.

- [ ] **Step 3: Commit**

```bash
git add apps/marketing/components/magic/story-carousel.tsx
git commit -m "feat(magic): add self-paced story-carousel wait journey"
```

---

## Task 8: Auto-analyse on arrival + wire StoryCarousel, retire SwipeDeck

Fixes the double-click (#1) and the stuck-after-swipe bug by replacing the wait UI with `StoryCarousel`.

**Files:**
- Modify: `components/magic/start-flow.tsx`
- Remove: `components/magic/swipe-deck.tsx`

- [ ] **Step 1: Auto-analyse when an initial URL is present**

In `components/magic/start-flow.tsx`, update the imports:

```tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { MagicResult } from "@/lib/magic/types";
import { StoryCarousel } from "./story-carousel";
import { Reveal } from "./reveal";
```

Add an effect right after the `analyse` `useCallback` (before `handleUnlock`) that fires once on mount when an initial URL was supplied:

```tsx
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStarted.current && initialUrl.trim()) {
      autoStarted.current = true;
      analyse(initialUrl.trim());
    }
  }, [initialUrl, analyse]);
```

- [ ] **Step 2: Replace the `analysing` phase render with `StoryCarousel`**

Replace the whole `if (phase === "analysing")` block with:

```tsx
  if (phase === "analysing") {
    return (
      <Centered>
        <StoryCarousel ready={ready} onDone={() => setPhase("emailGate")} />
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Centered>
    );
  }
```

- [ ] **Step 3: Delete the old SwipeDeck**

Run (from repo root or marketing dir):

```bash
git rm apps/marketing/components/magic/swipe-deck.tsx
```

- [ ] **Step 4: Confirm no remaining references to SwipeDeck**

Run: `pnpm exec grep -rn "swipe-deck\|SwipeDeck" .` (or use your editor search)
Expected: no matches outside the design/plan docs.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/marketing/components/magic/start-flow.tsx
git commit -m "feat(magic): auto-analyse on arrival; wire story-carousel, drop swipe-deck"
```

---

## Task 9: BrandedPost real logo + BrandedPostCarousel

Post avatar uses the real logo (never the OG image); posts shown one at a time with arrows + dots.

**Files:**
- Modify: `components/magic/branded-post.tsx`
- Create: `components/magic/branded-post-carousel.tsx`

- [ ] **Step 1: Use the real logo in `branded-post.tsx`**

The `BrandedPost` already prefers `brand.logoUrl` and falls back to a monogram — and after Task 4 `logoUrl` is the real logo (never the OG image), so no avatar change is needed. Make the **post image** use the brand palette explicitly (it already does via `accent`/`accent2`) and add the brand name as a subtle watermark so the code-built visual reads as "theirs". Replace the image `div` (the `h-44` block) with:

```tsx
      <div className="relative h-44 w-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
        <span className="absolute bottom-2 right-3 text-xs font-semibold text-white/70">{brand.name}</span>
      </div>
```

- [ ] **Step 2: Create `components/magic/branded-post-carousel.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { MagicBrand, MagicSamplePost } from "@/lib/magic/types";
import { nextIndex, prevIndex } from "@/lib/magic/carousel";
import { BrandedPost } from "./branded-post";

export function BrandedPostCarousel({
  posts,
  brand,
}: {
  posts: MagicSamplePost[];
  brand: MagicBrand;
}) {
  const [i, setI] = useState(0);
  if (!posts.length) return null;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mx-auto max-w-sm">
        <BrandedPost post={posts[i]} brand={brand} />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setI((c) => prevIndex(c, posts.length))}
          disabled={i === 0}
          aria-label="Previous post"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] disabled:opacity-30"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          {posts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Go to post ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-indigo-400" : "w-1.5 bg-white/20"}`}
            />
          ))}
        </div>
        <button
          onClick={() => setI((c) => nextIndex(c, posts.length))}
          disabled={i === posts.length - 1}
          aria-label="Next post"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06] disabled:opacity-30"
        >
          ›
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/components/magic/branded-post.tsx apps/marketing/components/magic/branded-post-carousel.tsx
git commit -m "feat(magic): one-post-at-a-time branded carousel with real logo"
```

---

## Task 10: "Centre stage" Reveal layout

Big post carousel on top; Brand DNA / tone / avatars as cards beneath.

**Files:**
- Modify: `components/magic/reveal.tsx`

- [ ] **Step 1: Rewrite `components/magic/reveal.tsx`**

```tsx
import type { MagicResult } from "@/lib/magic/types";
import { BrandDna } from "./brand-dna";
import { AvatarCards } from "./avatar-cards";
import { BrandedPostCarousel } from "./branded-post-carousel";

export function Reveal({ result }: { result: MagicResult }) {
  return (
    <div className="flex flex-col gap-12">
      {/* Centre stage: the branded posts lead. */}
      <section>
        <h2 className="mb-6 text-center text-xl font-bold tracking-tight">Sample posts, in your brand</h2>
        <BrandedPostCarousel posts={result.samplePosts} brand={result.brand} />
      </section>

      {/* Supporting cards beneath. */}
      <section className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Your Brand DNA</h3>
          <BrandDna brand={result.brand} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Who to target</h3>
          <AvatarCards avatars={result.avatars} />
        </div>
      </section>
    </div>
  );
}
```

> `AvatarCards` already renders its own responsive grid; nested inside one column it will stack — acceptable. If it looks cramped during manual review, drop the `md:grid-cols-2` so DNA and avatars stack full-width.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/marketing/components/magic/reveal.tsx
git commit -m "feat(magic): centre-stage Brand DNA reveal layout"
```

---

## Task 11: Full verification + docs

- [ ] **Step 1: Run the whole marketing test suite**

Run: `pnpm test`
Expected: PASS — all `lib/**/*.test.ts` green (scrape, generate, colors, carousel, journey-cards, validation).

- [ ] **Step 2: Typecheck, lint, build**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: all succeed.

- [ ] **Step 3: Manual run — verify the journey end to end**

Run: `pnpm dev` then in a browser:
1. On the home page, type a real URL (e.g. `automatedpanda.com`) and click **See your brand DNA** → confirm it goes **straight** into the story carousel (no second click). [#1]
2. Click through the carousel cards; use the swipe buttons on Card 2 (they cycle branded posts, never get stuck). [#3]
3. When analysis finishes, confirm **Skip to results ✨** appears; also confirm reaching the finale before completion auto-advances when ready. [#3]
4. Enter an email → on the reveal, confirm: posts show **one at a time** with arrows/dots, the avatar is the **logo** (or a coloured monogram), and the **palette matches the site's real colours**. [#2, #4, #5]

Record anything off; fix before merging.

- [ ] **Step 4: Update `docs/native.md`**

Under Stage 2, append a dated note:

```markdown
- [x] **Magic flow redesign (2026-06-10)** — from the first real test (automatedpanda.com):
      one-click analyse from the hero (#1); real declared-hex brand colours via
      `lib/magic/colors.ts` (#2); self-paced `StoryCarousel` wait journey replacing the
      broken swipe deck, skippable when ready (#3); code-built branded visuals, no AI
      image calls pre-paywall (#4); "centre stage" Brand DNA layout with the real logo and
      a one-post-at-a-time carousel (#5). See
      `docs/superpowers/plans/2026-06-10-magic-flow-redesign.md`.
```

- [ ] **Step 5: Commit**

```bash
git add docs/native.md
git commit -m "docs(native): record magic-flow redesign"
```

---

## Self-Review (completed by author)

**Spec coverage:**
- #1 double-click → Task 8 (auto-analyse on mount). ✅
- #2 real colours → Tasks 2 + 3 (extraction + scrape wiring) + Task 4 (authoritative in prompt). ✅
- #3 journey + broken swipe → Tasks 5, 6, 7, 8 (nav helper, branded data, StoryCarousel, wiring + delete SwipeDeck). ✅
- #4 code-built visuals → Tasks 6 (branded data) + 9 (branded post image). No AI image calls added. ✅
- #5 layout + logo + one-at-a-time → Tasks 1 (logo split), 9 (carousel + logo), 10 (centre-stage layout). ✅

**Placeholder scan:** No TBD/TODO; every code step shows full code; every test step shows the assertions. ✅

**Type consistency:** `BrandSignals.logoUrl`/`palette` added in Task 1/3 and consumed in Task 4; `nextIndex`/`prevIndex` defined in Task 5 and used in Tasks 7/9; `JourneySamplePost`/`JOURNEY_SAMPLE_POSTS` defined in Task 6 and used in Task 7; `StoryCarousel` props (`ready`, `onDone`) defined in Task 7 and supplied in Task 8; `BrandedPostCarousel` props (`posts`, `brand`) defined in Task 9 and used in Task 10. ✅

**Deferred (documented in spec):** logo-image colour quantization (only if declared colours prove insufficient in real use) — not required for this plan.
