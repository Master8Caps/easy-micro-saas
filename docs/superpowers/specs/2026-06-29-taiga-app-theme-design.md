# Taiga App Theme — Design

**Date:** 2026-06-29
**Branch:** `feat/taiga-app-theme`
**Status:** Approved design, pending implementation plan

## Goal

Ship a **Taiga-branded variant of the product app** (`apps/app`) — same app, same
backend, recoloured to match the Taiga calm marketing site. Served **per
deployment** via an env flag, mirroring how `apps/marketing` already does its
techy/calm variants. No per-user theming, no schema changes.

## Decisions (locked)

| Question | Decision |
|---|---|
| Theming scope | **Per deployment** — second app deployment with `NEXT_PUBLIC_SITE_VARIANT=calm` |
| Recolour depth | **Full warm palette**, light-only (drop dark mode for calm) |
| Headings font | **Keep Outfit sans** — no Fraunces (dashboard legibility) |
| Wordmark | **Swap to "Taiga"** + forest leaf (name, title, favicon) on calm |
| Card gradients | **Calm gradient set** — forest/ember/birch |

## Architecture

Mirror the established `apps/marketing` variant system.

### 1. Variant resolver — `apps/app/lib/variant.ts` (new)
Mirrors `apps/marketing/lib/variant.ts`:
```ts
export type SiteVariant = "techy" | "calm";
export function resolveVariant(v: string | undefined): SiteVariant {
  return v === "calm" ? "calm" : "techy";
}
export const SITE_VARIANT = resolveVariant(process.env.NEXT_PUBLIC_SITE_VARIANT);

export interface AppBrand { variant: SiteVariant; name: string; title: string; }
export const APP_BRANDS: Record<SiteVariant, AppBrand> = {
  techy: { variant: "techy", name: "Easy Micro SaaS", title: "Marketing Machine" },
  calm:  { variant: "calm",  name: "Taiga",           title: "Taiga" },
};
export const APP_BRAND = APP_BRANDS[SITE_VARIANT];
```
Static per deployment (read from env at build). Add `variant.test.ts` mirroring
the marketing resolver test.

### 2. Theme tokens — `apps/app/app/globals.css` (restructure)
Wrap today's palette as the techy default; add a calm block. Calm has **no
`.dark` block**, so it is light-only by construction. Techy's dark rules are
re-scoped under `[data-variant="techy"].dark` so calm + a stray `.dark` class
can never collide.

```css
:root, [data-variant="techy"] { /* existing indigo/zinc light vars */ }
[data-variant="techy"].dark   { /* existing dark vars */ }

[data-variant="calm"] {
  --color-bg-primary:   #F4EEE3;   /* linen */
  --color-bg-secondary: #EFE8DB;
  --color-bg-tertiary:  #E8E0D2;
  --color-bg-card:      #FFFFFF;
  --color-bg-card-hover:#F7F2E9;
  --color-text-primary: #1F2C24;   /* pine */
  --color-text-secondary:#4A574C;
  --color-text-muted:   #6B7568;
  --color-border:       #E0D8C8;
  --color-border-subtle:#EDE6D8;
  --color-shadow:       rgba(31,44,36,0.06);
  --color-accent:       #2F4A3C;   /* forest */
  --color-accent-2:     #C0623E;   /* ember */
}
```
`--font-heading` stays Outfit for both variants (no font change).

> Exact secondary/tertiary/border linen shades are a starting point and will be
> visually tuned during implementation against the marketing site.

### 3. Force light for calm
- `theme-script.tsx`: when calm, never add `.dark` (early return after removing it).
- `theme-provider.tsx`: when calm, lock `resolvedTheme = "light"`, `setTheme` no-ops.
- Hide `ThemeToggle` and the Settings theme section when `SITE_VARIANT === "calm"`.
- Techy path is unchanged — keeps its dark default + toggle.

Variant is exposed to client components via the `data-variant` attribute (set on
`<html>`) and/or `NEXT_PUBLIC_SITE_VARIANT` (a public env var, readable client-side).

### 4. Hardcoded-colour cleanup (the bulk of the work)
~117 hardcoded `indigo-/purple-/violet-` utility usages across ~25 files plus
raw hex won't follow the CSS-var swap. Convert to the existing semantic tokens
so they recolour automatically per variant:
- Utility classes → `accent` / `accent-2` / `surface` / `content` / `line` tokens
  (e.g. `text-indigo-400` → `text-accent` for the sidebar active state).
- **Leaf logo SVG** (`fill="#6366f1"`, duplicated in ~6 files: `icon.svg`,
  `login`, `setup`, `waitlist`, `dashboard-shell`, `mobile-nav`) → `fill="currentColor"`
  driven by an accent-coloured wrapper, so it's forest on calm / indigo on techy.
- **`post-card.tsx` `GRADIENTS`** → variant-aware set; calm uses forest/ember/birch.
- **glow shadow** `rgba(99,102,241,…)` in the tailwind preset/config → token-driven.

### 5. Branding
`"Easy Micro SaaS"` wordmark (`dashboard-shell.tsx`, `mobile-nav.tsx`), the
`layout.tsx` metadata `title`, and the favicon all read from `APP_BRAND` →
`"Taiga"` + forest leaf on calm.

### 6. Layout — `apps/app/app/layout.tsx`
- Set `data-variant={SITE_VARIANT}` on `<html>`.
- Metadata `title` from `APP_BRAND.title`.
- No new font (Outfit/DM Sans unchanged).

### 7. Deployment
A **third Vercel project** (e.g. `app.gettaiga.com`):
- Root Directory: `apps/app` (lesson learned: verify it actually **saves**).
- Env: `NEXT_PUBLIC_SITE_VARIANT=calm`, plus `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (this app uses `@supabase/ssr` — note the
  `NEXT_PUBLIC_` names) and the app's other existing env vars.
- Shares the same Supabase backend — same product/data, second skinned front door.

## Non-goals (YAGNI)

- Per-user / per-account theming.
- Dark mode for the calm variant.
- A Fraunces / serif heading font in the app.
- Any backend, auth, or data-model change.
- Refactoring app features beyond what the recolour touches.

## Testing

- `apps/app/lib/variant.test.ts` — resolver unit test (mirror marketing).
- Local visual pass: run with `NEXT_PUBLIC_SITE_VARIANT=calm`, then `=techy`;
  confirm both render and no `.dark` styling leaks into calm.
- Final grep: no stray `indigo-/purple-/violet-` or raw accent hex remain in
  `apps/app/app` + `apps/app/components` UI.

## Risks / notes

- **Shared backend, two front doors:** a user can log into either URL against the
  same Supabase project and see a different skin. Acceptable for now (per the
  per-deployment decision); revisit only if Taiga needs a separate user base.
- The hardcoded-colour sweep is the effort centre of gravity, not the token swap.
  Worth a careful pass so nothing stays indigo on the calm build.
