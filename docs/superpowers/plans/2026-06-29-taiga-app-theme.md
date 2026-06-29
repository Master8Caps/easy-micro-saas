# Taiga App Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Taiga-branded calm variant of the product app (`apps/app`), served per-deployment via an env flag, recoloured to match the Taiga marketing site.

**Architecture:** Mirror the existing `apps/marketing` variant system — a `lib/variant.ts` resolver reads `NEXT_PUBLIC_SITE_VARIANT`, `<html data-variant>` selects a CSS-variable palette, and the calm variant is light-only with Taiga branding. No backend, auth, or schema change.

**Tech Stack:** Next.js (App Router), Tailwind (CSS-var-driven tokens, `darkMode: "class"`), Vitest, pnpm. App dev server runs on port **3001**.

## Global Constraints

- Variant flag: `NEXT_PUBLIC_SITE_VARIANT` — `"calm"` selects Taiga, anything else → `"techy"` (verbatim match, mirror `apps/marketing/lib/variant.ts`).
- Calm palette (RGB hex): paper/linen `#F4EEE3`, card `#FFFFFF`, pine text `#1F2C24`, forest accent `#2F4A3C`, ember accent-2 `#C0623E`, sage `#88A38B`, birch `#C2A878`.
- Techy palette/behaviour is UNCHANGED — every change is additive or guarded by `SITE_VARIANT`.
- Calm is **light-only**: no `.dark` class ever applied; theme toggle + Settings "Appearance" hidden.
- Headings stay **Outfit** sans for both variants (no Fraunces).
- Wordmark/title: techy `"Easy Micro SaaS"` / `"Marketing Machine"`; calm `"Taiga"` / `"Taiga"`.
- Test command (from repo root): `pnpm --filter app test` — or `cd apps/app && pnpm vitest run`.
- Typecheck: `cd apps/app && pnpm typecheck`.
- Local visual check (PowerShell): `$env:NEXT_PUBLIC_SITE_VARIANT="calm"; pnpm --filter app dev` → http://localhost:3001 . Bash: `NEXT_PUBLIC_SITE_VARIANT=calm pnpm --filter app dev`.

> **Pre-existing working-tree changes:** `apps/app/components/review/post-card.tsx`, `apps/app/server/actions/review.ts`, and `docs/taiga.md` carry uncommitted changes from earlier image-feature work. Tasks 5 and 6 touch `post-card.tsx`. Commit or stash those first so task commits stay clean.

---

### Task 1: Variant resolver + brand config

**Files:**
- Create: `apps/app/lib/variant.ts`
- Test: `apps/app/lib/variant.test.ts`

**Interfaces:**
- Produces: `type SiteVariant = "techy" | "calm"`; `resolveVariant(value: string | undefined): SiteVariant`; `SITE_VARIANT: SiteVariant`; `interface AppBrand { variant: SiteVariant; name: string; title: string }`; `APP_BRANDS: Record<SiteVariant, AppBrand>`; `APP_BRAND: AppBrand`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/app/lib/variant.test.ts
import { describe, it, expect } from "vitest";
import { resolveVariant, APP_BRANDS } from "./variant";

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

describe("APP_BRANDS", () => {
  it("calm brand is Taiga", () => {
    expect(APP_BRANDS.calm.name).toBe("Taiga");
    expect(APP_BRANDS.calm.title).toBe("Taiga");
  });
  it("techy brand keeps Easy Micro SaaS", () => {
    expect(APP_BRANDS.techy.name).toBe("Easy Micro SaaS");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/app && pnpm vitest run lib/variant.test.ts`
Expected: FAIL — cannot resolve `./variant`.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/app/lib/variant.ts
export type SiteVariant = "techy" | "calm";

export function resolveVariant(value: string | undefined): SiteVariant {
  return value === "calm" ? "calm" : "techy";
}

export const SITE_VARIANT: SiteVariant = resolveVariant(
  process.env.NEXT_PUBLIC_SITE_VARIANT,
);

export interface AppBrand {
  variant: SiteVariant;
  name: string; // wordmark shown in the app UI
  title: string; // browser/document title
}

export const APP_BRANDS: Record<SiteVariant, AppBrand> = {
  techy: { variant: "techy", name: "Easy Micro SaaS", title: "Marketing Machine" },
  calm: { variant: "calm", name: "Taiga", title: "Taiga" },
};

export const APP_BRAND: AppBrand = APP_BRANDS[SITE_VARIANT];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/app && pnpm vitest run lib/variant.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/app/lib/variant.ts apps/app/lib/variant.test.ts
git commit -m "feat(app): variant resolver + brand config"
```

---

### Task 2: Calm palette tokens + data-variant wiring

**Files:**
- Modify: `apps/app/app/globals.css` (add calm block after the `.dark` block)
- Modify: `apps/app/app/layout.tsx:17-36`

**Interfaces:**
- Consumes: `SITE_VARIANT`, `APP_BRAND` from `@/lib/variant`.
- Produces: `<html data-variant="…">` attribute and a `[data-variant="calm"]` CSS-var palette that later tasks rely on for automatic recolour.

- [ ] **Step 1: Add the calm palette block to `globals.css`**

Insert this block immediately AFTER the existing `.dark { … }` block (so its equal-specificity rules win source-order on `<html data-variant="calm">`). Do NOT modify `:root` or `.dark`.

```css
  [data-variant="calm"] {
    --color-bg-primary: #f4eee3;      /* linen */
    --color-bg-secondary: #efe8db;
    --color-bg-tertiary: #e8e0d2;
    --color-bg-card: #ffffff;
    --color-bg-card-hover: #f7f2e9;
    --color-text-primary: #1f2c24;    /* pine */
    --color-text-secondary: #4a574c;
    --color-text-muted: #6b7568;
    --color-border: #e0d8c8;
    --color-border-subtle: #ede6d8;
    --color-shadow: rgba(31, 44, 36, 0.06);
    --color-accent: #2f4a3c;          /* forest */
    --color-accent-2: #c0623e;        /* ember */
  }
```

- [ ] **Step 2: Wire `data-variant` + title into `layout.tsx`**

Add the import and use `SITE_VARIANT` / `APP_BRAND`:

```tsx
// top of apps/app/app/layout.tsx, with the other imports
import { SITE_VARIANT, APP_BRAND } from "@/lib/variant";
```

Change the metadata title (line ~18) from the literal to the brand:

```tsx
export const metadata: Metadata = {
  title: APP_BRAND.title,
  description: "AI-powered marketing for micro SaaS",
};
```

Add `data-variant` to the `<html>` tag (line ~28):

```tsx
    <html
      lang="en"
      data-variant={SITE_VARIANT}
      className={`${outfit.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/app && pnpm typecheck`
Expected: PASS — no type errors.

- [ ] **Step 4: Visual check — calm renders linen, techy unchanged**

PowerShell: `$env:NEXT_PUBLIC_SITE_VARIANT="calm"; pnpm --filter app dev` → open http://localhost:3001 .
Expected: background is warm linen (`#F4EEE3`), text is pine/dark. Stop, then run without the var (`Remove-Item Env:\NEXT_PUBLIC_SITE_VARIANT; pnpm --filter app dev`) and confirm techy is unchanged (dark default). Hardcoded indigo accents still showing is EXPECTED here — Task 5 fixes those.

- [ ] **Step 5: Commit**

```bash
git add apps/app/app/globals.css apps/app/app/layout.tsx
git commit -m "feat(app): calm palette tokens + data-variant wiring"
```

---

### Task 3: Force light for calm + hide theme controls

**Files:**
- Modify: `apps/app/components/theme-script.tsx`
- Modify: `apps/app/components/theme-provider.tsx`
- Modify: `apps/app/components/sidebar-nav.tsx:6,195`
- Modify: `apps/app/app/(dashboard)/settings/settings-form.tsx` (Appearance section, ~line 354)

**Interfaces:**
- Consumes: `SITE_VARIANT` from `@/lib/variant`.

- [ ] **Step 1: Make `theme-script.tsx` variant-aware**

Replace the file body so calm emits a script that only ever removes `dark`:

```tsx
import { SITE_VARIANT } from "@/lib/variant";

export function ThemeScript() {
  if (SITE_VARIANT === "calm") {
    // Calm is light-only — never apply the dark class.
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.remove('dark');`,
        }}
      />
    );
  }

  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('theme') || 'dark';
        var resolved = theme;
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
```

- [ ] **Step 2: Lock `theme-provider.tsx` to light on calm**

Add the import and three guards. Add at top with imports:

```tsx
import { SITE_VARIANT } from "@/lib/variant";
```

Change the initial state defaults (lines ~30-31) to honour calm:

```tsx
  const [theme, setThemeState] = useState<Theme>(
    SITE_VARIANT === "calm" ? "light" : "dark",
  );
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(
    SITE_VARIANT === "calm" ? "light" : "dark",
  );
```

Guard the localStorage init effect (the first `useEffect`) so calm forces light and skips stored prefs:

```tsx
  useEffect(() => {
    if (SITE_VARIANT === "calm") {
      document.documentElement.classList.remove("dark");
      setThemeState("light");
      setResolvedTheme("light");
      return;
    }
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial = stored || "dark";
    setThemeState(initial);
    setResolvedTheme(applyTheme(initial));
  }, []);
```

Guard `setTheme` so it no-ops on calm:

```tsx
  const setTheme = (newTheme: Theme) => {
    if (SITE_VARIANT === "calm") return; // light-locked
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    setResolvedTheme(applyTheme(newTheme));
    updateThemePreference(newTheme).catch(() => {});
  };
```

- [ ] **Step 3: Hide the sidebar `ThemeToggle` on calm**

In `apps/app/components/sidebar-nav.tsx`, add the import near the top (alongside the existing `ThemeToggle` import on line 6):

```tsx
import { SITE_VARIANT } from "@/lib/variant";
```

Change line ~195 from `<ThemeToggle />` to:

```tsx
        {SITE_VARIANT !== "calm" && <ThemeToggle />}
```

- [ ] **Step 4: Hide the Settings "Appearance" section on calm**

In `apps/app/app/(dashboard)/settings/settings-form.tsx`, add the import:

```tsx
import { SITE_VARIANT } from "@/lib/variant";
```

Wrap the entire Appearance block — the element starting at the `{/* ── Appearance ── */}` comment (~line 354) and its theme-option buttons — in a calm guard:

```tsx
      {SITE_VARIANT !== "calm" && (
        /* ── Appearance ── */
        <section>
          {/* ...existing Appearance heading + light/dark/system buttons... */}
        </section>
      )}
```

(Keep the existing inner JSX intact; only add the `{SITE_VARIANT !== "calm" && ( … )}` wrapper around the existing section element.)

- [ ] **Step 5: Typecheck**

Run: `cd apps/app && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Visual check — calm has no toggle, no dark; techy keeps both**

Run calm dev (`$env:NEXT_PUBLIC_SITE_VARIANT="calm"; pnpm --filter app dev`). Confirm: no theme toggle in the sidebar, Settings has no Appearance section, and forcing `localStorage.theme="dark"` in DevTools then reloading does NOT darken the app. Then run techy (no env var) and confirm the toggle + Appearance still work and dark is default.

- [ ] **Step 7: Commit**

```bash
git add apps/app/components/theme-script.tsx apps/app/components/theme-provider.tsx apps/app/components/sidebar-nav.tsx "apps/app/app/(dashboard)/settings/settings-form.tsx"
git commit -m "feat(app): light-lock calm variant + hide theme controls"
```

---

### Task 4: Branding — wordmark + leaf logo

**Files:**
- Modify: `apps/app/components/dashboard-shell.tsx:76,85`
- Modify: `apps/app/components/mobile-nav.tsx:31,39`
- Modify: `apps/app/app/login/page.tsx:70`
- Modify: `apps/app/app/setup/page.tsx:63`
- Modify: `apps/app/app/waitlist/page.tsx:17`
- Create: `apps/app/app/icon.tsx` (dynamic favicon) — Delete: `apps/app/app/icon.svg`

**Interfaces:**
- Consumes: `APP_BRAND`, `SITE_VARIANT` from `@/lib/variant`.

- [ ] **Step 1: Swap the wordmark text to the brand name**

In `apps/app/components/dashboard-shell.tsx`, import `APP_BRAND` and replace the literal `Easy Micro SaaS` (line ~85) with `{APP_BRAND.name}`:

```tsx
import { APP_BRAND } from "@/lib/variant";
// …
              {APP_BRAND.name}
```

Do the same in `apps/app/components/mobile-nav.tsx` (line ~39):

```tsx
import { APP_BRAND } from "@/lib/variant";
// …
        <span className="font-heading text-sm font-semibold">{APP_BRAND.name}</span>
```

- [ ] **Step 2: Make the inline leaf logos accent-coloured**

In each of these files the leaf SVG path has `fill="#6366f1"`. Change `fill="#6366f1"` → `fill="currentColor"` and ensure the `<svg>` (or its wrapping element) carries `className="text-accent"` so it follows the variant palette (forest on calm, indigo on techy):
- `apps/app/components/dashboard-shell.tsx:76`
- `apps/app/components/mobile-nav.tsx:31`
- `apps/app/app/login/page.tsx:70`
- `apps/app/app/setup/page.tsx:63`
- `apps/app/app/waitlist/page.tsx:17`

Example transform:

```tsx
// before
<svg viewBox="0 0 32 32" className="h-7 w-7">
  <path d="M16,3 Q21,10 21,18 Q21,24 16,24 Q11,24 11,18 Q11,10 16,3Z" fill="#6366f1"/>
</svg>
// after
<svg viewBox="0 0 32 32" className="h-7 w-7 text-accent">
  <path d="M16,3 Q21,10 21,18 Q21,24 16,24 Q11,24 11,18 Q11,10 16,3Z" fill="currentColor"/>
</svg>
```

- [ ] **Step 3: Replace the static favicon with a variant-aware dynamic icon**

Delete `apps/app/app/icon.svg` and create `apps/app/app/icon.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { SITE_VARIANT } from "@/lib/variant";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const color = SITE_VARIANT === "calm" ? "#2F4A3C" : "#6366F1";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <path
            d="M16,3 Q21,10 21,18 Q21,24 16,24 Q11,24 11,18 Q11,10 16,3Z"
            fill={color}
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/app && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Visual check**

Calm dev: sidebar + mobile nav read "Taiga", leaf is forest green, browser tab favicon is forest. Techy dev: reads "Easy Micro SaaS", leaf indigo.

- [ ] **Step 6: Commit**

```bash
git add apps/app/components/dashboard-shell.tsx apps/app/components/mobile-nav.tsx apps/app/app/login/page.tsx apps/app/app/setup/page.tsx apps/app/app/waitlist/page.tsx apps/app/app/icon.tsx
git rm apps/app/app/icon.svg
git commit -m "feat(app): variant-aware wordmark + leaf logo + favicon"
```

---

### Task 5: Hardcoded-colour sweep → semantic tokens

Convert hardcoded `indigo-/purple-/violet-` Tailwind utilities to the CSS-var-driven semantic tokens so they recolour automatically per variant. This is the bulk of the visual work; work file-by-file, re-running the grep gate after each.

**Files (modify):** all 24 —
`apps/app/app/(dashboard)/admin/users/page.tsx`,
`apps/app/app/(dashboard)/analytics/analytics-dashboard.tsx`,
`apps/app/app/(dashboard)/analytics/social-performance.tsx`,
`apps/app/app/(dashboard)/campaigns/campaign-list.tsx`,
`apps/app/app/(dashboard)/campaigns/campaign-panel.tsx`,
`apps/app/app/(dashboard)/content/content-list.tsx`,
`apps/app/app/(dashboard)/page.tsx`,
`apps/app/app/(dashboard)/products/new/page.tsx`,
`apps/app/app/(dashboard)/products/[id]/brain/avatar-edit-panel.tsx`,
`apps/app/app/(dashboard)/products/[id]/brain/page.tsx`,
`apps/app/app/(dashboard)/schedule/month-grid.tsx`,
`apps/app/app/(dashboard)/schedule/schedule-calendar.tsx`,
`apps/app/app/(dashboard)/settings/settings-form.tsx`,
`apps/app/app/login/page.tsx`,
`apps/app/app/setup/page.tsx`,
`apps/app/components/date-picker.tsx`,
`apps/app/components/engagement-popover.tsx`,
`apps/app/components/image-generator.tsx`,
`apps/app/components/lifecycle-action.tsx`,
`apps/app/components/metricool-publish-modal.tsx`,
`apps/app/components/onboarding-checklist.tsx`,
`apps/app/components/pills.tsx`,
`apps/app/components/review/post-card.tsx`,
`apps/app/components/review/review-deck.tsx`,
`apps/app/components/sidebar-nav.tsx`

**Mapping (apply per occurrence; use opacity modifiers for lighter tones since tokens are single-value):**

| Hardcoded | Replace with |
|---|---|
| `text-indigo-300/400/500`, `text-violet-*` | `text-accent` (lighter shade → `text-accent/80`) |
| `bg-indigo-500/600` | `bg-accent` |
| `bg-indigo-500/10`, `bg-indigo-500/20` | `bg-accent/10`, `bg-accent/20` |
| `border-indigo-500`, `border-indigo-500/40` | `border-accent`, `border-accent/40` |
| `ring-indigo-500`, `focus:ring-indigo-*` | `ring-accent`, `focus:ring-accent` |
| `hover:bg-indigo-600`, `hover:text-indigo-300` | `hover:bg-accent`, `hover:text-accent` |
| `text-purple-*`, `bg-purple-*`, `border-purple-*` | `…-accent-2` equivalents |
| `from-indigo-* to-purple-*` (decorative gradient) | leave for Task 6 if it's the post-card placeholder; otherwise `from-accent to-accent-2` |

Rules: replace ONLY accent-intent colours. Do NOT touch semantic status colours (green/emerald success, red/rose danger, amber/yellow warning, sky/blue info) — those stay. If a usage is genuinely decorative-multistop and not an accent, note it and move to Task 6.

- [ ] **Step 1: Inventory the starting count**

Run: `grep -rEc "indigo-|purple-|violet-" apps/app/app apps/app/components | grep -v ":0" | grep -v node_modules`
Expected: ~117 matches across 24 files. Record the number.

- [ ] **Step 2: Convert file-by-file**

For each file in the list, apply the mapping table. After each file, re-run the per-file grep to confirm it's clean, e.g.:
Run: `grep -nE "indigo-|purple-|violet-" apps/app/components/sidebar-nav.tsx`
Expected: no output (file clean) — except any intentional status-colour false positives, which there should be none of for these tokens.

- [ ] **Step 3: Grep gate — no accent colours remain**

Run: `grep -rnE "indigo-|purple-|violet-" apps/app/app apps/app/components | grep -v node_modules`
Expected: NO output. (If a line legitimately must remain, justify it in the commit message; default expectation is zero.)

- [ ] **Step 4: Typecheck**

Run: `cd apps/app && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Visual check — both variants**

Calm dev: active sidebar item, buttons, links, focus rings, pills are forest/ember — no indigo anywhere. Techy dev: looks identical to before this task (accent token resolves to the original indigo).

- [ ] **Step 6: Commit**

```bash
git add apps/app/app apps/app/components
git commit -m "refactor(app): hardcoded accent colours -> semantic tokens"
```

---

### Task 6: Calm card gradients + tokenised glow

**Files:**
- Modify: `apps/app/components/review/post-card.tsx:8-13` (the `GRADIENTS` array)
- Modify: `apps/app/tailwind.config.ts:42-44` (`boxShadow.glow`)
- Modify: `apps/app/app/globals.css` (add `--color-glow` to `:root`, `.dark`, and `[data-variant="calm"]`)

**Interfaces:**
- Consumes: `SITE_VARIANT` from `@/lib/variant`.

- [ ] **Step 1: Make the post-card gradients variant-aware**

In `apps/app/components/review/post-card.tsx`, import `SITE_VARIANT` and branch the `GRADIENTS` constant:

```tsx
import { SITE_VARIANT } from "@/lib/variant";

const GRADIENTS =
  SITE_VARIANT === "calm"
    ? [
        "linear-gradient(135deg,#2F4A3C,#C0623E)", // forest → ember
        "linear-gradient(135deg,#88A38B,#2F4A3C)", // sage → forest
        "linear-gradient(135deg,#C2A878,#C0623E)", // birch → ember
        "linear-gradient(135deg,#2F4A3C,#88A38B)", // forest → sage
      ]
    : [
        "linear-gradient(135deg,#6366f1,#a855f7)",
        "linear-gradient(135deg,#0ea5e9,#6366f1)",
        "linear-gradient(135deg,#a855f7,#ec4899)",
        // ...keep the remaining existing techy gradients exactly as they are...
      ];
```

(Preserve every existing techy gradient string in the `else` branch — copy them verbatim from the current array.)

- [ ] **Step 2: Add `--color-glow` tokens to `globals.css`**

Add `--color-glow` to each palette block:
- in `:root` (and the existing `.dark`): `--color-glow: rgba(99, 102, 241, 0.18);`
- in `[data-variant="calm"]`: `--color-glow: rgba(47, 74, 60, 0.15);`

- [ ] **Step 3: Tokenise the glow shadow in `tailwind.config.ts`**

Change line ~43 from:

```ts
        glow: "0 0 50px rgba(99,102,241,0.18)",
```

to:

```ts
        glow: "0 0 50px var(--color-glow)",
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/app && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Visual check**

Calm dev: post-card image placeholders show forest/ember/birch gradients; any `shadow-glow` element glows forest-green. Techy dev: original indigo/purple gradients and indigo glow unchanged.

- [ ] **Step 6: Final full-app grep gate**

Run: `grep -rnE "indigo-|purple-|violet-|6366f1|a855f7" apps/app/app apps/app/components | grep -v node_modules`
Expected: NO output — all accent colour is now token- or variant-driven.

- [ ] **Step 7: Commit**

```bash
git add apps/app/components/review/post-card.tsx apps/app/tailwind.config.ts apps/app/app/globals.css
git commit -m "feat(app): calm card gradients + tokenised glow"
```

---

### Task 7: Deploy the Taiga app (manual — Vercel)

Not code — a checklist for the Vercel dashboard. Do this after Tasks 1-6 are merged to `main`.

- [ ] **Step 1: Create the third Vercel project**

New Project → import the same GitHub repo → **Root Directory: `apps/app`** (confirm it SAVES — the dropdown silently reverted last time). Framework: Next.js. Production branch: `main`.

- [ ] **Step 2: Set environment variables**

Copy all of the existing EMS app project's env vars, then set/confirm:
- `NEXT_PUBLIC_SITE_VARIANT=calm`
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **`NEXT_PUBLIC_` names** (this app uses `@supabase/ssr`), same Supabase project as EMS.
- All other app env vars (Anthropic/OpenAI/Resend/etc.) copied from the EMS app project.
- Scope: **Production** (and Preview if you want preview deploys).

- [ ] **Step 3: Deploy + point the domain**

Deploy. Add the Taiga app domain (e.g. `app.gettaiga.com`) under Settings → Domains, follow DNS. Confirm HTTPS issues and the app loads in Taiga colours (warm linen, forest accents, "Taiga" wordmark, no theme toggle).

- [ ] **Step 4: Smoke-test**

Log in, open the Review deck, open Settings (no Appearance section), confirm no indigo anywhere and the favicon is the forest leaf.

---

## Notes

- Shared backend: this deployment hits the same Supabase project as EMS, so it's the same product/data behind a Taiga skin at a second URL. A user could log into either URL and see a different colour scheme — acceptable per the per-deployment decision.
- After Task 6's grep gate is clean, the calm build should have zero hardcoded accent colour. If new indigo creeps in later, re-run the gate.
