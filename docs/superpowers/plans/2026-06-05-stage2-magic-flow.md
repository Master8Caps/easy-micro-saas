# Stage 2 — URL-first "Magic" Pre-Purchase Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, pre-purchase experience on the marketing site where a visitor enters their URL, watches it get analysed (while swiping sample posts), and unlocks a free, brand-personalised Brand DNA + avatars + sample posts behind an email gate.

**Architecture:** Self-contained in `apps/marketing`. Server modules under `lib/magic/` (scrape → generate → store) are pure/isolated and unit-tested with Vitest. Two API routes (`analyze`, `unlock`) orchestrate them. A client state-machine page (`/start`) drives input → analysing+swipe → email gate → reveal. A permalink page (`/magic/[id]`) re-renders a stored result for the email link. The Anthropic call runs inside the `analyze` request; the client awaits that promise in the background while the user swipes (no polling/background jobs).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind, `@anthropic-ai/sdk`, `@supabase/supabase-js` (service role), Resend, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-05-stage2-magic-flow-design.md`

---

## File Structure

**Create:**
- `apps/marketing/lib/magic/types.ts` — shared types (`BrandSignals`, `MagicResult`, …)
- `apps/marketing/lib/magic/validation.ts` — `normaliseUrl`, `isValidEmail`
- `apps/marketing/lib/magic/validation.test.ts`
- `apps/marketing/lib/magic/scrape.ts` — `extractSignals` (pure) + `fetchBrandSignals`
- `apps/marketing/lib/magic/scrape.test.ts`
- `apps/marketing/lib/magic/generate.ts` — `generateMagicResult` + prompt
- `apps/marketing/lib/magic/generate.test.ts`
- `apps/marketing/lib/magic/store.ts` — `magic_leads` CRUD
- `apps/marketing/lib/magic/rate-limit.ts` — in-memory per-IP daily cap
- `apps/marketing/lib/magic/email.ts` — Resend "here's your brand DNA" email
- `apps/marketing/app/api/magic/analyze/route.ts`
- `apps/marketing/app/api/magic/unlock/route.ts`
- `apps/marketing/components/magic/branded-post.tsx`
- `apps/marketing/components/magic/brand-dna.tsx`
- `apps/marketing/components/magic/avatar-cards.tsx`
- `apps/marketing/components/magic/reveal.tsx` — composes the three above
- `apps/marketing/components/magic/swipe-deck.tsx`
- `apps/marketing/components/magic/start-flow.tsx` — client state machine
- `apps/marketing/app/start/page.tsx`
- `apps/marketing/app/magic/[id]/page.tsx`
- `apps/marketing/vitest.config.ts`

**Modify:**
- `apps/marketing/package.json` — add deps + `test` script
- `apps/marketing/.env.example` — document `ANTHROPIC_API_KEY`, `MAGIC_MODEL`
- `apps/marketing/components/hero.tsx` — URL input as primary entry
- `docs/native.md` — tick Stage 2 progress

**Run manually (not in git):** `magic_leads` table SQL (Supabase) — see Task 1.

---

## Task 1: Project setup — deps, Vitest, env, DB

**Files:**
- Modify: `apps/marketing/package.json`
- Create: `apps/marketing/vitest.config.ts`
- Modify: `apps/marketing/.env.example`

- [ ] **Step 1: Add dependencies**

Run (from repo root):
```bash
pnpm --filter @repo/marketing add @anthropic-ai/sdk
pnpm --filter @repo/marketing add -D vitest
```

- [ ] **Step 2: Add the `test` script**

In `apps/marketing/package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `apps/marketing/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Document env vars** in `apps/marketing/.env.example` (append):

```
# Magic flow (Stage 2) — anonymous brand analysis + generation
ANTHROPIC_API_KEY=sk-ant-...            # Server-only. Used by the Anthropic SDK.
MAGIC_MODEL=claude-sonnet-4-6           # Optional — Claude model for the teaser generation.
```

- [ ] **Step 5: Create the `magic_leads` table in Supabase**

Run this SQL in the Supabase SQL editor (not tracked in git — `supabase/migrations/` is gitignored):
```sql
create table if not exists magic_leads (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  source_url  text not null,
  result      jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists magic_leads_email_idx on magic_leads (email);
create index if not exists magic_leads_source_url_idx on magic_leads (source_url);
```

- [ ] **Step 6: Verify the test runner works**

Run: `pnpm --filter @repo/marketing test`
Expected: Vitest runs and reports "No test files found" (exit 0) — confirms wiring before any tests exist.

- [ ] **Step 7: Commit**

```bash
git add apps/marketing/package.json apps/marketing/vitest.config.ts apps/marketing/.env.example pnpm-lock.yaml
git commit -m "chore(magic): add anthropic sdk, vitest, and env for Stage 2"
```

---

## Task 2: Shared types

**Files:**
- Create: `apps/marketing/lib/magic/types.ts`

- [ ] **Step 1: Write the types**

```ts
// apps/marketing/lib/magic/types.ts

export interface BrandSignals {
  url: string;
  title: string;
  description: string;
  ogImage?: string;
  themeColor?: string;
  favicon?: string;
  headings: string[];
  text: string;
  /** True when the page yielded too little to generate well. */
  thin: boolean;
}

export interface MagicBrand {
  name: string;
  tagline: string;
  tone: string[];
  /** Hex colours, e.g. ["#10b981", "#34d399"]. */
  palette: string[];
  logoUrl?: string;
  positioning: string;
}

export interface MagicAvatar {
  name: string;
  role: string;
  painPoints: string[];
  channels: string[];
}

export interface MagicSamplePost {
  platform: string;
  caption: string;
  hashtags: string[];
  engagement: { likes: number; comments: number; shares: number };
}

export interface MagicResult {
  brand: MagicBrand;
  avatars: MagicAvatar[];
  samplePosts: MagicSamplePost[];
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/marketing/lib/magic/types.ts
git commit -m "feat(magic): add shared types"
```

---

## Task 3: Validation helpers (TDD)

**Files:**
- Create: `apps/marketing/lib/magic/validation.ts`
- Test: `apps/marketing/lib/magic/validation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/marketing/lib/magic/validation.test.ts
import { describe, it, expect } from "vitest";
import { normaliseUrl, isValidEmail } from "./validation";

describe("normaliseUrl", () => {
  it("adds https:// when missing", () => {
    expect(normaliseUrl("example.com")).toBe("https://example.com/");
  });
  it("keeps an existing scheme", () => {
    expect(normaliseUrl("http://example.com")).toBe("http://example.com/");
  });
  it("trims whitespace", () => {
    expect(normaliseUrl("  example.com  ")).toBe("https://example.com/");
  });
  it("returns null for a host with no dot", () => {
    expect(normaliseUrl("localhost")).toBeNull();
  });
  it("returns null for empty input", () => {
    expect(normaliseUrl("")).toBeNull();
  });
});

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
  });
  it("rejects a missing domain", () => {
    expect(isValidEmail("a@b")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/marketing test`
Expected: FAIL — cannot resolve `./validation`.

- [ ] **Step 3: Write the implementation**

```ts
// apps/marketing/lib/magic/validation.ts

export function normaliseUrl(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/marketing test`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/validation.ts apps/marketing/lib/magic/validation.test.ts
git commit -m "feat(magic): add url + email validation (tested)"
```

---

## Task 4: Brand-signal scraper (TDD)

`extractSignals(html, url)` is pure (HTML string → `BrandSignals`) so it's tested without network. `fetchBrandSignals(url)` wraps it with a timed fetch.

**Files:**
- Create: `apps/marketing/lib/magic/scrape.ts`
- Test: `apps/marketing/lib/magic/scrape.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/marketing/lib/magic/scrape.test.ts
import { describe, it, expect } from "vitest";
import { extractSignals } from "./scrape";

const RICH = `
<html><head>
  <title>Northwind — calm productivity</title>
  <meta name="description" content="Reclaim your weekends.">
  <meta property="og:image" content="/logo.png">
  <meta name="theme-color" content="#10b981">
  <link rel="icon" href="/favicon.ico">
</head><body>
  <h1>Work less, live more</h1>
  <h2>Built for busy founders</h2>
  <script>var x = 1;</script>
  <p>Northwind helps you automate the boring parts of running a business.</p>
</body></html>`;

describe("extractSignals", () => {
  it("pulls title, description, og:image, theme-color, favicon", () => {
    const s = extractSignals(RICH, "https://northwind.com");
    expect(s.title).toBe("Northwind — calm productivity");
    expect(s.description).toBe("Reclaim your weekends.");
    expect(s.ogImage).toBe("https://northwind.com/logo.png");
    expect(s.themeColor).toBe("#10b981");
    expect(s.favicon).toBe("https://northwind.com/favicon.ico");
  });
  it("collects headings and strips scripts from text", () => {
    const s = extractSignals(RICH, "https://northwind.com");
    expect(s.headings).toContain("Work less, live more");
    expect(s.text).not.toContain("var x");
    expect(s.thin).toBe(false);
  });
  it("flags thin pages", () => {
    const s = extractSignals("<html><body></body></html>", "https://x.com");
    expect(s.thin).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/marketing test`
Expected: FAIL — cannot resolve `./scrape`.

- [ ] **Step 3: Write the implementation**

```ts
// apps/marketing/lib/magic/scrape.ts
import type { BrandSignals } from "./types";

const UA =
  "Mozilla/5.0 (compatible; EMSBot/1.0; +https://easymicrosaas.com)";
const MAX_TEXT = 6000;
const TIMEOUT_MS = 8000;

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function abs(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
}

function metaContent(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1].trim() : undefined;
}

function ogContent(html: string, prop: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+property=["']${prop}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1].trim() : undefined;
}

export function extractSignals(html: string, url: string): BrandSignals {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const description =
    metaContent(html, "description") ?? ogContent(html, "og:description") ?? "";
  const ogImage = abs(ogContent(html, "og:image"), url);
  const themeColor = metaContent(html, "theme-color");
  const favMatch = html.match(
    /<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i,
  );
  const favicon = abs(favMatch ? favMatch[1] : undefined, url);

  const headings = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)]
    .map((m) => stripTags(m[1]))
    .filter(Boolean)
    .slice(0, 12);

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = stripTags(body).slice(0, MAX_TEXT);

  const thin = text.length < 200 && headings.length === 0;

  return {
    url,
    title,
    description,
    ogImage,
    themeColor,
    favicon,
    headings,
    text,
    thin,
  };
}

function emptySignals(url: string): BrandSignals {
  return {
    url,
    title: "",
    description: "",
    headings: [],
    text: "",
    thin: true,
  };
}

export async function fetchBrandSignals(url: string): Promise<BrandSignals> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return emptySignals(url);
    const html = await res.text();
    return extractSignals(html, url);
  } catch {
    return emptySignals(url);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/marketing test`
Expected: PASS (all scrape + validation tests).

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/scrape.ts apps/marketing/lib/magic/scrape.test.ts
git commit -m "feat(magic): add brand-signal scraper (tested)"
```

---

## Task 5: Generation engine (TDD with mocked Anthropic)

**Files:**
- Create: `apps/marketing/lib/magic/generate.ts`
- Test: `apps/marketing/lib/magic/generate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/marketing/lib/magic/generate.test.ts
import { describe, it, expect, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { generateMagicResult } from "./generate";
import type { BrandSignals } from "./types";

const SIGNALS: BrandSignals = {
  url: "https://northwind.com",
  title: "Northwind",
  description: "Reclaim your weekends.",
  ogImage: "https://northwind.com/logo.png",
  themeColor: "#10b981",
  headings: ["Work less, live more"],
  text: "Northwind automates the boring parts.",
  thin: false,
};

const VALID_JSON = JSON.stringify({
  brand: {
    name: "Northwind",
    tagline: "Reclaim your weekends",
    tone: ["calm", "friendly"],
    palette: ["#10b981", "#34d399"],
    positioning: "Automation for busy founders.",
  },
  avatars: [
    { name: "Maya", role: "Solo founder", painPoints: ["No time"], channels: ["Instagram"] },
  ],
  samplePosts: [
    { platform: "Instagram", caption: "Reclaim your weekends.", hashtags: ["#worklife"], engagement: { likes: 200, comments: 12, shares: 5 } },
  ],
});

function mockClient(text: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({ content: [{ type: "text", text }] }),
    },
  } as unknown as Anthropic;
}

describe("generateMagicResult", () => {
  it("parses valid JSON and fills logoUrl from signals", async () => {
    const result = await generateMagicResult(SIGNALS, undefined, mockClient(VALID_JSON));
    expect(result.brand.name).toBe("Northwind");
    expect(result.brand.logoUrl).toBe("https://northwind.com/logo.png");
    expect(result.avatars).toHaveLength(1);
    expect(result.samplePosts[0].platform).toBe("Instagram");
  });

  it("extracts JSON even with surrounding prose", async () => {
    const result = await generateMagicResult(
      SIGNALS,
      undefined,
      mockClient("Here you go:\n" + VALID_JSON + "\nHope that helps!"),
    );
    expect(result.brand.tone).toEqual(["calm", "friendly"]);
  });

  it("retries once then throws on persistent bad output", async () => {
    const client = {
      messages: { create: vi.fn().mockResolvedValue({ content: [{ type: "text", text: "no json here" }] }) },
    } as unknown as Anthropic;
    await expect(generateMagicResult(SIGNALS, undefined, client)).rejects.toThrow();
    expect((client.messages.create as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/marketing test`
Expected: FAIL — cannot resolve `./generate`.

- [ ] **Step 3: Write the implementation**

```ts
// apps/marketing/lib/magic/generate.ts
import Anthropic from "@anthropic-ai/sdk";
import type { BrandSignals, MagicResult } from "./types";

const MODEL = process.env.MAGIC_MODEL ?? "claude-sonnet-4-6";

export function buildMagicPrompt(
  signals: BrandSignals,
  description?: string,
): string {
  return `You are a brand strategist. From the website signals below, infer the brand identity and produce a short, punchy marketing teaser.

WEBSITE SIGNALS
- URL: ${signals.url}
- Title: ${signals.title}
- Description: ${signals.description}
- Headings: ${signals.headings.join(" | ")}
- Body excerpt: ${signals.text}
${signals.themeColor ? `- Theme colour: ${signals.themeColor}` : ""}
${description ? `- Owner's one-line description: ${description}` : ""}

INSTRUCTIONS
1. Infer the brand: name, a short tagline, 2-3 tone-of-voice adjectives, and a palette of 2-4 hex colours that fit the brand (use the theme colour if given, otherwise infer tasteful colours).
2. Write a one-sentence positioning summary.
3. Create 2-3 specific customer avatars: name, role, 2-3 pain points, 2 channels each.
4. Write 3 sample social posts in the brand's tone: platform, caption, 2-3 hashtags, and realistic engagement numbers (likes/comments/shares).

Respond with ONLY valid JSON in exactly this shape:
{
  "brand": { "name": "", "tagline": "", "tone": ["",""], "palette": ["#hex"], "positioning": "" },
  "avatars": [ { "name": "", "role": "", "painPoints": ["",""], "channels": ["",""] } ],
  "samplePosts": [ { "platform": "", "caption": "", "hashtags": ["#tag"], "engagement": { "likes": 0, "comments": 0, "shares": 0 } } ]
}`;
}

function normaliseResult(raw: MagicResult, signals: BrandSignals): MagicResult {
  return {
    brand: {
      name: raw.brand?.name || signals.title || "Your brand",
      tagline: raw.brand?.tagline || "",
      tone: raw.brand?.tone?.length ? raw.brand.tone : ["confident"],
      palette: raw.brand?.palette?.length
        ? raw.brand.palette
        : [signals.themeColor || "#6366f1", "#a78bfa"],
      logoUrl: raw.brand?.logoUrl || signals.ogImage || signals.favicon,
      positioning: raw.brand?.positioning || "",
    },
    avatars: Array.isArray(raw.avatars) ? raw.avatars : [],
    samplePosts: Array.isArray(raw.samplePosts) ? raw.samplePosts : [],
  };
}

export async function generateMagicResult(
  signals: BrandSignals,
  description?: string,
  client: Anthropic = new Anthropic(),
): Promise<MagicResult> {
  const prompt = buildMagicPrompt(signals, description);
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      const block = msg.content.find((b) => b.type === "text");
      if (!block || block.type !== "text") throw new Error("No text response");
      const match = block.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      const parsed = JSON.parse(match[0]) as MagicResult;
      return normaliseResult(parsed, signals);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Generation failed");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/marketing test`
Expected: PASS (3 generate tests + earlier tests).

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/generate.ts apps/marketing/lib/magic/generate.test.ts
git commit -m "feat(magic): add generation engine with retry (tested)"
```

---

## Task 6: Store, rate-limit, and email helpers

These are thin IO wrappers; verified via the route integration and manual testing (no unit tests — they only call out to Supabase/Resend).

**Files:**
- Create: `apps/marketing/lib/magic/store.ts`
- Create: `apps/marketing/lib/magic/rate-limit.ts`
- Create: `apps/marketing/lib/magic/email.ts`

- [ ] **Step 1: Write `store.ts`**

```ts
// apps/marketing/lib/magic/store.ts
import { createClient } from "@supabase/supabase-js";
import type { MagicResult } from "./types";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DEDUPE_WINDOW_HOURS = 24;

export async function createLead(
  sourceUrl: string,
  result: MagicResult,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("magic_leads")
    .insert({ source_url: sourceUrl, result })
    .select("id")
    .single();
  if (error || !data) {
    console.error("createLead error:", error);
    return null;
  }
  return data.id as string;
}

export async function attachEmail(id: string, email: string): Promise<boolean> {
  const { error } = await supabase
    .from("magic_leads")
    .update({ email: email.toLowerCase().trim() })
    .eq("id", id);
  if (error) console.error("attachEmail error:", error);
  return !error;
}

export async function getLead(
  id: string,
): Promise<{ sourceUrl: string; result: MagicResult } | null> {
  const { data, error } = await supabase
    .from("magic_leads")
    .select("source_url, result")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return { sourceUrl: data.source_url, result: data.result as MagicResult };
}

export async function findRecentResultByUrl(
  url: string,
): Promise<MagicResult | null> {
  const since = new Date(
    Date.now() - DEDUPE_WINDOW_HOURS * 3600_000,
  ).toISOString();
  const { data } = await supabase
    .from("magic_leads")
    .select("result")
    .eq("source_url", url)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? (data.result as MagicResult) : null;
}
```

- [ ] **Step 2: Write `rate-limit.ts`** (in-memory; resets on cold start — acceptable for v1)

```ts
// apps/marketing/lib/magic/rate-limit.ts

const DAILY_CAP = 20;
const buckets = new Map<string, { count: number; day: string }>();

/** Returns true if this IP is over the daily cap. */
export function isRateLimited(ip: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const entry = buckets.get(ip);
  if (!entry || entry.day !== day) {
    buckets.set(ip, { count: 1, day });
    return false;
  }
  entry.count += 1;
  return entry.count > DAILY_CAP;
}
```

- [ ] **Step 3: Write `email.ts`**

```ts
// apps/marketing/lib/magic/email.ts
import { Resend } from "resend";
import { SITE_ORIGIN } from "@/lib/blog/supabase";
import type { MagicResult } from "./types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBrandDnaEmail(
  to: string,
  id: string,
  result: MagicResult,
): Promise<void> {
  const link = `${SITE_ORIGIN}/magic/${id}`;
  try {
    await resend.emails.send({
      from: "Easy Micro SaaS <hello@easymicrosaas.com>",
      to,
      subject: `Your Brand DNA for ${result.brand.name}`,
      html: `<!DOCTYPE html><html><body style="margin:0;background:#09090b;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fafafa;padding:40px 20px">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="480" style="max-width:480px;background:#18181b;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:32px">
<tr><td>
  <h1 style="margin:0 0 12px;font-size:22px">Your Brand DNA is ready</h1>
  <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#a1a1aa">We analysed <strong style="color:#e4e4e7">${result.brand.name}</strong> and built your avatars + sample posts. View it any time:</p>
  <a href="${link}" style="display:inline-block;background:#fff;color:#09090b;text-decoration:none;font-weight:700;border-radius:999px;padding:12px 24px;font-size:14px">View your Brand DNA</a>
</td></tr></table>
<p style="margin-top:24px;font-size:12px;color:#71717a">Easy Micro SaaS &middot; easymicrosaas.com</p>
</td></tr></table></body></html>`,
    });
  } catch (err) {
    console.error("sendBrandDnaEmail error:", err);
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @repo/marketing typecheck`
Expected: PASS (no errors).

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/lib/magic/store.ts apps/marketing/lib/magic/rate-limit.ts apps/marketing/lib/magic/email.ts
git commit -m "feat(magic): add store, rate-limit, and email helpers"
```

---

## Task 7: `POST /api/magic/analyze`

**Files:**
- Create: `apps/marketing/app/api/magic/analyze/route.ts`

- [ ] **Step 1: Write the route**

```ts
// apps/marketing/app/api/magic/analyze/route.ts
import { NextResponse } from "next/server";
import { normaliseUrl } from "@/lib/magic/validation";
import { fetchBrandSignals } from "@/lib/magic/scrape";
import { generateMagicResult } from "@/lib/magic/generate";
import { createLead, findRecentResultByUrl } from "@/lib/magic/store";
import { isRateLimited } from "@/lib/magic/rate-limit";

export async function POST(request: Request) {
  let body: { url?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url = normaliseUrl(body.url ?? "");
  if (!url) {
    return NextResponse.json(
      { error: "Please enter a valid website address." },
      { status: 400 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "You've hit today's limit. Try again tomorrow." },
      { status: 429 },
    );
  }

  try {
    // Dedupe: reuse a recent generation for this URL, but still make a fresh lead row.
    let result = await findRecentResultByUrl(url);

    if (!result) {
      const signals = await fetchBrandSignals(url);
      if (signals.thin && !body.description) {
        return NextResponse.json({ needsDescription: true });
      }
      result = await generateMagicResult(signals, body.description);
    }

    const id = await createLead(url, result);
    if (!id) {
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }

    return NextResponse.json({ id, result });
  } catch (err) {
    console.error("magic/analyze error:", err);
    return NextResponse.json(
      { error: "We couldn't build your result. Please try again." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @repo/marketing typecheck`
Expected: PASS.

- [ ] **Step 3: Manual smoke test**

Start dev (`pnpm --filter @repo/marketing dev`), then:
```bash
curl -s -X POST http://localhost:3000/api/magic/analyze -H "Content-Type: application/json" -d '{"url":"stripe.com"}' | head -c 400
```
Expected: JSON with an `id` and a `result.brand`. (Requires `ANTHROPIC_API_KEY` + Supabase env in `.env.local`.)

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/app/api/magic/analyze/route.ts
git commit -m "feat(magic): add analyze API route"
```

---

## Task 8: `POST /api/magic/unlock`

**Files:**
- Create: `apps/marketing/app/api/magic/unlock/route.ts`

- [ ] **Step 1: Write the route**

```ts
// apps/marketing/app/api/magic/unlock/route.ts
import { NextResponse } from "next/server";
import { isValidEmail } from "@/lib/magic/validation";
import { attachEmail, getLead } from "@/lib/magic/store";
import { sendBrandDnaEmail } from "@/lib/magic/email";

export async function POST(request: Request) {
  let body: { id?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, email } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Result not found." }, { status: 404 });
  }

  await attachEmail(id, email);
  // Fire-and-forget; errors are logged inside the helper.
  void sendBrandDnaEmail(email, id, lead.result);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @repo/marketing typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/marketing/app/api/magic/unlock/route.ts
git commit -m "feat(magic): add unlock API route + brand DNA email"
```

---

## Task 9: Reveal components (brand DNA, avatars, branded post)

Presentational components themed by a `brand` prop. No unit tests (dumb components — verified visually).

**Files:**
- Create: `apps/marketing/components/magic/branded-post.tsx`
- Create: `apps/marketing/components/magic/brand-dna.tsx`
- Create: `apps/marketing/components/magic/avatar-cards.tsx`
- Create: `apps/marketing/components/magic/reveal.tsx`

- [ ] **Step 1: `branded-post.tsx`** — a social card themed by the brand palette/logo, with engagement chrome

```tsx
// apps/marketing/components/magic/branded-post.tsx
import type { MagicBrand, MagicSamplePost } from "@/lib/magic/types";

export function BrandedPost({
  post,
  brand,
}: {
  post: MagicSamplePost;
  brand: MagicBrand;
}) {
  const accent = brand.palette[0] ?? "#6366f1";
  const accent2 = brand.palette[1] ?? accent;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white text-zinc-900 shadow-xl">
      <div className="flex items-center gap-2 p-3">
        {brand.logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={brand.logoUrl} alt={brand.name} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: accent }}>
            {brand.name.slice(0, 1)}
          </span>
        )}
        <div className="leading-tight">
          <p className="text-sm font-semibold">{brand.name}</p>
          <p className="text-[11px] text-zinc-500">{post.platform}</p>
        </div>
      </div>

      <div className="h-44 w-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})` }} />

      <div className="p-3">
        <div className="flex items-center gap-4 py-1 text-zinc-700">
          <span className="text-sm">♥ {post.engagement.likes}</span>
          <span className="text-sm">💬 {post.engagement.comments}</span>
          <span className="text-sm">↗ {post.engagement.shares}</span>
        </div>
        <p className="mt-1 text-sm">
          <span className="font-semibold">{brand.name.toLowerCase().replace(/\s+/g, "")}</span>{" "}
          {post.caption}
        </p>
        <p className="mt-1 text-sm" style={{ color: accent }}>
          {post.hashtags.join(" ")}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `brand-dna.tsx`**

```tsx
// apps/marketing/components/magic/brand-dna.tsx
import type { MagicBrand } from "@/lib/magic/types";

export function BrandDna({ brand }: { brand: MagicBrand }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-zinc-100">{brand.name}</h3>
      {brand.tagline && <p className="mt-1 text-sm text-zinc-400">{brand.tagline}</p>}

      <div className="mt-5">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Tone of voice</p>
        <div className="flex flex-wrap gap-1.5">
          {brand.tone.map((t) => (
            <span key={t} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300">{t}</span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Palette</p>
        <div className="flex gap-1.5">
          {brand.palette.map((c) => (
            <span key={c} className="h-7 w-7 rounded-md border border-white/10" style={{ background: c }} />
          ))}
        </div>
      </div>

      {brand.positioning && (
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">{brand.positioning}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `avatar-cards.tsx`**

```tsx
// apps/marketing/components/magic/avatar-cards.tsx
import type { MagicAvatar } from "@/lib/magic/types";

export function AvatarCards({ avatars }: { avatars: MagicAvatar[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {avatars.map((a) => (
        <div key={a.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white">
              {a.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{a.name}</p>
              <p className="text-xs text-zinc-500">{a.role}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1">
            {a.painPoints.map((p) => (
              <li key={p} className="text-xs text-zinc-400">• {p}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {a.channels.map((c) => (
              <span key={c} className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">{c}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: `reveal.tsx`** — composes the result; reused by `/start` and `/magic/[id]`

```tsx
// apps/marketing/components/magic/reveal.tsx
import type { MagicResult } from "@/lib/magic/types";
import { BrandDna } from "./brand-dna";
import { AvatarCards } from "./avatar-cards";
import { BrandedPost } from "./branded-post";

export function Reveal({ result }: { result: MagicResult }) {
  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-4 text-xl font-bold tracking-tight">Your Brand DNA</h2>
        <BrandDna brand={result.brand} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold tracking-tight">Who to target</h2>
        <AvatarCards avatars={result.avatars} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold tracking-tight">Sample posts, in your brand</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.samplePosts.map((p, i) => (
            <BrandedPost key={i} post={p} brand={result.brand} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm --filter @repo/marketing typecheck`
Expected: PASS.
```bash
git add apps/marketing/components/magic/branded-post.tsx apps/marketing/components/magic/brand-dna.tsx apps/marketing/components/magic/avatar-cards.tsx apps/marketing/components/magic/reveal.tsx
git commit -m "feat(magic): add brand DNA, avatar, branded-post, reveal components"
```

---

## Task 10: Swipe deck (interactive wait)

A self-contained client component that shows canned sample posts to swipe while analysis runs. Calls `onDone` when the user has swiped the deck.

**Files:**
- Create: `apps/marketing/components/magic/swipe-deck.tsx`

- [ ] **Step 1: Write the component**

```tsx
// apps/marketing/components/magic/swipe-deck.tsx
"use client";

import { useState } from "react";

const SAMPLES = [
  { platform: "Instagram", caption: "You shipped. Now what? Here's the plan.", tag: "#buildinpublic" },
  { platform: "X", caption: "3 lessons from launch week 🧵", tag: "#indiehackers" },
  { platform: "LinkedIn", caption: "The tool won't save you. The system will.", tag: "#saas" },
  { platform: "Instagram", caption: "How we found our first 100 users.", tag: "#startup" },
];

export function SwipeDeck({ onDone }: { onDone?: () => void }) {
  const [index, setIndex] = useState(0);
  const current = SAMPLES[index];

  function swipe() {
    const next = index + 1;
    if (next >= SAMPLES.length) {
      onDone?.();
      setIndex(next);
      return;
    }
    setIndex(next);
  }

  if (index >= SAMPLES.length) {
    return (
      <p className="text-center text-sm text-zinc-400">Nice — that's the idea. Almost ready…</p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <p className="mb-4 text-center text-sm text-zinc-400">
        Try the swipe-to-approve queue while we work ✨
      </p>
      <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-3 shadow-xl">
        <p className="mb-2 text-xs text-zinc-400">{current.platform}</p>
        <div className="h-40 rounded-xl bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-zinc-800" />
        <p className="mt-3 text-sm text-zinc-200">{current.caption}</p>
        <p className="mt-1 text-xs text-indigo-300/80">{current.tag}</p>
        <div className="mt-4 flex items-center justify-center gap-6">
          <button onClick={swipe} aria-label="Skip" className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">✗</button>
          <button onClick={swipe} aria-label="Approve" className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">♥</button>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-600">{index + 1} / {SAMPLES.length}</p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter @repo/marketing typecheck`
Expected: PASS.
```bash
git add apps/marketing/components/magic/swipe-deck.tsx
git commit -m "feat(magic): add interactive swipe deck for the wait"
```

---

## Task 11: `/start` flow orchestrator (client state machine)

Drives `input → analysing(+swipe) → emailGate → reveal`. Fires `analyze` on mount/submit; awaits it in the background while the user swipes.

**Files:**
- Create: `apps/marketing/components/magic/start-flow.tsx`
- Create: `apps/marketing/app/start/page.tsx`

- [ ] **Step 1: Write `start-flow.tsx`**

```tsx
// apps/marketing/components/magic/start-flow.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MagicResult } from "@/lib/magic/types";
import { SwipeDeck } from "./swipe-deck";
import { Reveal } from "./reveal";

type Phase = "input" | "analysing" | "needsDescription" | "emailGate" | "reveal";

export function StartFlow({ initialUrl = "" }: { initialUrl?: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [url, setUrl] = useState(initialUrl);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [result, setResult] = useState<MagicResult | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const analyse = useCallback(
    async (targetUrl: string, desc?: string) => {
      setError("");
      setPhase("analysing");
      setReady(false);
      try {
        const res = await fetch("/api/magic/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl, description: desc }),
        });
        const data = await res.json();
        if (data.needsDescription) {
          setPhase("needsDescription");
          return;
        }
        if (!res.ok) {
          setError(data.error || "Something went wrong.");
          setPhase("input");
          return;
        }
        setId(data.id);
        setResult(data.result);
        setReady(true);
      } catch {
        setError("Something went wrong. Please try again.");
        setPhase("input");
      }
    },
    [],
  );

  async function handleUnlock() {
    setError("");
    const res = await fetch("/api/magic/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    setPhase("reveal");
  }

  // ---- Render per phase ----

  if (phase === "input") {
    return (
      <Centered>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">See your brand, decoded.</h1>
        <p className="mt-3 text-zinc-400">Enter your website — we'll analyse it and show your brand DNA, avatars, and sample posts. Free.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (url.trim()) analyse(url); }}
          className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourwebsite.com" className="flex-1 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none" />
          <button type="submit" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">Analyse my site →</button>
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Centered>
    );
  }

  if (phase === "needsDescription") {
    return (
      <Centered>
        <h1 className="text-2xl font-bold tracking-tight">Tell us a touch more</h1>
        <p className="mt-3 text-zinc-400">We couldn't read enough from your site. In one line, what does your business do?</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (description.trim()) analyse(url, description); }}
          className="mt-8 flex w-full max-w-md flex-col gap-3"
        >
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. A booking app for dog groomers" className="rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none" />
          <button type="submit" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">Continue →</button>
        </form>
      </Centered>
    );
  }

  if (phase === "analysing") {
    return (
      <Centered>
        <SwipeDeck onDone={() => { if (ready) setPhase("emailGate"); }} />
        <button
          onClick={() => ready && setPhase("emailGate")}
          disabled={!ready}
          className="mt-8 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] disabled:opacity-40"
        >
          {ready ? "See my Brand DNA →" : "Analysing your brand…"}
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Centered>
    );
  }

  if (phase === "emailGate") {
    return (
      <Centered>
        <h1 className="text-2xl font-bold tracking-tight">Your Brand DNA is ready ✨</h1>
        <p className="mt-3 text-zinc-400">Pop in your email to reveal it — we'll send you a copy too.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); handleUnlock(); }}
          className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none" />
          <button type="submit" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">Reveal it →</button>
        </form>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Centered>
    );
  }

  // reveal
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      {result && <Reveal result={result} />}
      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Ready to put it to work?</h2>
        <p className="text-zinc-400">Unlock the full machine — content queue, ads, scheduling and more.</p>
        <button
          onClick={() => router.push(`/signup?lead=${id}`)}
          className="mt-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
        >
          Start for £49.95/mo
        </button>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Write `app/start/page.tsx`**

```tsx
// apps/marketing/app/start/page.tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { StartFlow } from "@/components/magic/start-flow";

export const metadata = {
  title: "See your Brand DNA — Easy Micro SaaS",
  description: "Enter your website and get your brand DNA, customer avatars, and sample posts — free.",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  return (
    <>
      <Navbar />
      <main>
        <StartFlow initialUrl={url ?? ""} />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `pnpm --filter @repo/marketing typecheck`
Expected: PASS.
```bash
git add apps/marketing/components/magic/start-flow.tsx apps/marketing/app/start/page.tsx
git commit -m "feat(magic): add /start flow orchestrator"
```

---

## Task 12: `/magic/[id]` permalink page

Renders a stored result for the email link.

**Files:**
- Create: `apps/marketing/app/magic/[id]/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// apps/marketing/app/magic/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/magic/reveal";
import { getLead } from "@/lib/magic/store";

export const metadata = {
  title: "Your Brand DNA — Easy Micro SaaS",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MagicResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-24">
        <Reveal result={lead.result} />
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Ready to put it to work?</h2>
          <Link href={`/signup?lead=${id}`} className="mt-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200">
            Start for £49.95/mo
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter @repo/marketing typecheck`
Expected: PASS.
```bash
git add apps/marketing/app/magic/[id]/page.tsx
git commit -m "feat(magic): add /magic/[id] result permalink"
```

---

## Task 13: Hero URL entry

Make the hero's primary action a URL field that routes to `/start?url=`.

**Files:**
- Modify: `apps/marketing/components/hero.tsx`

- [ ] **Step 1: Update the imports at the top of `hero.tsx`**

The interactive input is extracted into a small client component (the hero itself stays a server component). Replace the import block at the top of `apps/marketing/components/hero.tsx` — note `Link` is dropped because the two CTA `Link`s are being removed in Step 3:
```tsx
import { AnimateOnScroll } from "./animate-on-scroll";
import { HeroUrlInput } from "./magic/hero-url-input";
```

- [ ] **Step 2: Create `apps/marketing/components/magic/hero-url-input.tsx`**

```tsx
// apps/marketing/components/magic/hero-url-input.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroUrlInput() {
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
        placeholder="yourwebsite.com"
        aria-label="Your website address"
        className="flex-1 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-indigo-500/50 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/[0.1]"
      >
        See your brand DNA →
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Swap the CTA block in `hero.tsx`**

Replace the existing CTA `<div className="mt-10 flex flex-col items-center gap-4">…</div>` block (the two `Link`s + trust line) with:
```tsx
        <AnimateOnScroll delay={240}>
          <div className="mt-10 flex flex-col items-center gap-4">
            <HeroUrlInput />
            <p className="text-sm text-zinc-500">{copy.trust}</p>
          </div>
        </AnimateOnScroll>
```
Keep the `copy` object; the `primaryCta` / `secondaryCta` strings are now unused — remove those two keys from `copy` to avoid dead code. (The `Link` import was already dropped in Step 1.)

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm --filter @repo/marketing typecheck && pnpm --filter @repo/marketing lint`
Expected: PASS, no unused-var warnings.

- [ ] **Step 5: Commit**

```bash
git add apps/marketing/components/hero.tsx apps/marketing/components/magic/hero-url-input.tsx
git commit -m "feat(magic): make hero URL input the primary entry to /start"
```

---

## Task 14: Full run-through + docs

**Files:**
- Modify: `docs/native.md`

- [ ] **Step 1: End-to-end manual test**

With `.env.local` populated (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) and the `magic_leads` table created:
```bash
pnpm --filter @repo/marketing dev
```
Walk the flow: home hero → enter a real URL → swipe → email → reveal. Verify:
- Brand DNA shows the site's colours/logo.
- Avatars + 3 branded posts render.
- A row appears in `magic_leads` with the email after unlock.
- The Resend email arrives with a working `/magic/[id]` link.
- A blocked/empty site triggers the "tell us more" one-liner.

- [ ] **Step 2: Run the whole test suite + typecheck + lint**

Run: `pnpm --filter @repo/marketing test && pnpm --filter @repo/marketing typecheck && pnpm --filter @repo/marketing lint`
Expected: all PASS.

- [ ] **Step 3: Update `docs/native.md`** — under Stage 2, tick the items now done (URL scrape, decoupled anonymous generation, public result page, email capture) and note the `/start` + `/magic/[id]` routes and `magic_leads` table.

- [ ] **Step 4: Commit**

```bash
git add docs/native.md
git commit -m "docs(native): mark Stage 2 magic flow shipped"
```

---

## Notes for the implementer

- **Env:** the flow needs `ANTHROPIC_API_KEY` (Anthropic SDK reads it automatically), plus the existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`. Add them to `apps/marketing/.env.local`.
- **DB:** run the `magic_leads` SQL (Task 1, Step 5) in Supabase before testing routes.
- **Model:** default `claude-sonnet-4-6`; override with `MAGIC_MODEL` if needed.
- **Soft gate:** `analyze` returns the full result before the email — intentional for v1. Harden later by returning a teaser from `analyze` and the full payload from `unlock`.
- **Cost:** in-memory rate limit resets on cold start; URL dedupe is the main cost saver. Revisit if traffic grows.
