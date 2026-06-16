# Review Card Polish — Design

**Date:** 2026-06-16
**Branch:** `feat/dashboard-revamp` (follow-on polish, same branch)
**Status:** Approved (design), pending implementation plan

## Problem

After live-testing the new swipe Review hub, three issues surfaced on the post cards:

1. **Raw content-type label.** Cards print the raw enum value (`facebook-post`) instead of a human label (`Facebook Post`). A pretty-label component already exists (`TypePill`/`formatContentType` in `components/pills.tsx`) but the Review `PostCard` doesn't use it.
2. **Unclear context.** It isn't obvious *which product* a draft is for, *which platform* it targets, or *what type* of content it is. Today the product is tiny grey text at the very bottom, platform isn't shown at all, and type is the raw value above.
3. **"Phasing through" card stack.** The peek cards behind the top card use the *same* `bg-surface-card` fill, offset only 7px, with a hard border. When the top card tilts during a drag, the identically-coloured edges read as bleed/overlap rather than a clean deck.

Scope is **the Review hub card only**. Broader page polish (Content, Campaigns, Brain, Schedule) is deliberately deferred to a separate scoping pass.

## Decisions (validated via visual mockups)

- **Card layout = "Product-led header" (Option A).** Product is the first thing read in a review context.
- **Platform pill shows an icon + label** (e.g. Facebook glyph + "Facebook"), reusing the app's existing colored `ChannelPill`. Non-platform types (Email, Landing Page, Ad Copy, Tagline) keep a neutral pill with no icon.
- **Card stack = "Recessed dim deck".** Cards behind recede via larger offset, steeper scale, reduced opacity, and softer borders, so tilting the top card reveals shadow — not a twin card.

## Card anatomy (Option A)

```
┌──────────────────────────────────────┐
│ ● Acme Analytics        [▣ Facebook]  │  product (dot + name) · platform pill (icon+label)
│ ┌──────────────────────────────────┐ │
│ │        image / gradient          │ │
│ └──────────────────────────────────┘ │
│ [Image Post]          For · Founders  │  type pill · target avatar
│ Ship faster without the dashboards    │  title
│ Stop drowning in vanity metrics…      │  body (line-clamped)
└──────────────────────────────────────┘
```

## Components & changes

### 1. `apps/app/server/actions/review.ts` — surface the platform

`ReviewCard` and `getReviewDeck` don't currently carry a channel/platform. Add it.

- Extend `ReviewCard` with `channel: string | null`.
- Extend the `getReviewDeck` select to embed the campaign channel and read metadata:
  `campaigns(channel)` plus existing `metadata` (jsonb) selection.
- Resolve the channel with a small precedence helper, `resolveChannel(...)`:
  1. `campaigns.channel` (the established source, mirrors `content-list.tsx`)
  2. `metadata.channel`
  3. derived from the `type` prefix as a last resort (`facebook-post → facebook`, `linkedin-post → linkedin`, `twitter-post`/`twitter-thread → twitter`); otherwise `null`.
- The helper is pure and exported so it can be unit-tested.

### 2. `apps/app/components/pills.tsx` — platform icons on `ChannelPill`

- Add an inline-SVG icon map keyed by the same lowercased channel keys as `channelStyles` (linkedin, facebook, twitter/x, instagram, youtube, tiktok, pinterest, reddit, etc.).
- `ChannelPill` renders `icon + label` when a glyph exists for the channel; otherwise label only (current behaviour). Pill becomes an `inline-flex` with a small gap.
- This is a shared component — the Content and Campaigns pages that already render `ChannelPill` gain the icons too. That is desirable (consistency) and is the intended ripple, not a regression.

### 3. `apps/app/components/review/post-card.tsx` — rebuild to Option A

Replace the current body with the Option A anatomy:
- **Header row:** product name with a small accent dot on the left; `<ChannelPill channel={card.channel} />` on the right (rendered only when `card.channel` is non-null).
- **Image block:** unchanged gradient-or-image behaviour.
- **Meta row:** `<TypePill type={card.type} />` on the left; target avatar as `For · {avatarName}` on the right (only when present).
- **Title + body:** title bold, body `line-clamp`-ed.
- Remove the raw `{card.type}` span and the bottom-anchored product text — that data now lives in the header/meta rows.

### 4. `packages/ui/src/swipe/swipe-deck.tsx` — recessed dim deck

Only consumer is the app Review hub (dark theme); verified no other `SwipeDeck` usage. Marketing onboarding uses its own local card, so there is no cross-theme regression.

- Peek cards: increase offset to ~`(i+1)*14px`, steepen scale to ~`1 - (i+1)*0.06`.
- Make them recede with **reduced opacity** (e.g. ~0.6 then ~0.35) and a **softer border**, rather than the current full-strength identical fill. (Opacity-based recession keeps the effect theme-safe if the primitive is ever reused in the light marketing app.)
- Top card already renders an opaque `bg-surface-card` (`PostCard`), so nothing shows through it — no change needed there.
- Pure gesture logic, the ✗/♥ buttons, ←/→ keys, undo, and the reason chips are all untouched.

## Data flow

`getReviewDeck` (server) → resolves `channel` per piece → `ReviewCard[]` → `ReviewDeck` (client) → `PostCard` renders `ChannelPill(channel)` + `TypePill(type)` + product + avatar. `SwipeDeck` handles only stacking/gesture and is content-agnostic.

## Testing

- **Unit:** `resolveChannel(type, campaignChannel, metadataChannel)` precedence + type-prefix derivation (new test).
- **Existing:** swipe-gesture tests remain green (no logic change).
- **Manual:** Review hub — verify pretty type label, platform pill with icon, product + avatar placement; drag the top card and confirm the deck recedes cleanly with no bleed; confirm Content/Campaigns pages still render their `ChannelPill`s correctly with the new icons.

## Out of scope (noted for later)

- Broader visual polish of Content / Campaigns / Brain / Schedule pages (separate spec).
- Automatic image generation on draft creation (images remain on-demand).
- Per-product filtering of the Review deck (already a noted future add).
