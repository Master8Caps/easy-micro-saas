# Micro Machine — Project Plan

## Project Overview

Micro Machine is an internal-first SaaS product that turns a simple product brief into a structured early-growth engine. It helps find the right avatars, test positioning, and acquire the first 100 users for micro-SaaS products.

**Primary audience (initial):** Internal micro-SaaS products built by the team.
**Future audience:** Solo founders, indie hackers, early-stage SaaS teams.

### What It Does

1. Collects a short product/market/goals brief
2. Identifies and refines target avatars (ICPs)
3. Generates social campaign angles per avatar per channel
4. Generates ad campaign angles (retargeting + cold traffic) if user opts in
5. Generates a website kit (landing page copy, welcome emails, meta descriptions, taglines) if user has a website
6. Produces channel-specific content pieces with copy-to-clipboard
7. Tracks clicks and early engagement signals via redirect links
8. (Future) Identifies winning hooks/angles/avatars and regenerates based on performance

### Architecture

- **Monorepo:** pnpm workspaces + Turborepo
- **Marketing site** (`apps/marketing`): Conversion-focused single page, deployed to `yourdomain.com`
- **App** (`apps/app`): SaaS application, deployed to `app.yourdomain.com`
- **Shared packages:** UI components, TypeScript configs, shared types

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (dark-mode-first) |
| Database | Supabase (Postgres + pgvector) |
| Auth | Supabase Auth |
| Payments | Stripe |
| Primary LLM | Anthropic (Claude Sonnet 4) |
| Embeddings | OpenAI (deferred) |
| Hosting | Vercel (two deployments) |
| Email | Resend or Postmark (deferred) |

---

## Completed Work

### Infrastructure & Setup
- [x] Monorepo scaffolding (pnpm workspaces + Turborepo)
- [x] Root config: package.json, turbo.json, .gitignore, .npmrc, prettier
- [x] Shared packages: `@repo/config`, `@repo/ui`, `@repo/types`
- [x] Environment variables declared in turbo.json for Vercel builds
- [x] Vercel deployment (two projects — marketing + app)
- [x] Git repo on GitHub (Master8Caps/micro-machine)

### Data & Cache
- [x] `revalidatePath` added to all mutating server actions (products, content) to fix stale data across page navigation

### Database & Auth
- [x] Supabase project setup
- [x] Database schema — 11 tables: profiles, products, generations, avatars, campaigns, content_pieces, links, clicks, customers, subscriptions, waitlist
- [x] RLS policies on all tables (users access own data only)
- [x] Fix: Missing update policy on generations table (migration 00003)
- [x] Supabase Auth (email/password signup + login)
- [x] Protected routes via middleware (session refresh + route protection)
- [x] User roles system (admin, free, paid) — migration 00002
- [x] Content workstreams separation — migration 00004 (has_website, wants_ads, campaign categories, expanded content types)
- [x] Archived separated from workflow status — migration 00005 (archived boolean on campaigns + content_pieces, removed from status constraint)
- [x] Content format preferences — migration 00006 (content_formats column on products, video-hook removed from constraints)

### Marketing Site
- [x] 7-section conversion page (hero, problem, value, how-it-works, proof, CTA, footer)
- [x] Space Grotesk + Inter font setup
- [x] Dark-mode-first styling
- [x] Waitlist modal (button trigger, portal rendering, escape/backdrop dismiss)
- [x] Waitlist API endpoint + table
- [x] Blue-outlined glow cards with cursor-following radial gradient
- [x] Equal-height card grids
- [x] Blue gradient accent numbers

### App — Dashboard & Navigation
- [x] Dashboard layout with sidebar nav (route group `(dashboard)`)
- [x] SidebarNav client component with active state highlighting
- [x] Dashboard page with product count, campaign count, content count stats
- [x] Product list with StatusPill (green active, amber draft, gray archived)
- [x] Campaigns page (placeholder → real data)
- [x] Content page (placeholder → real data)
- [x] Analytics page — real dashboard with summary cards, 30-day chart, top links, clicks by channel

### App — Product Intake
- [x] 4-step intake form: product basics, goals, channels, extras
- [x] Step 4: "Do you have a website?" toggle + URL input
- [x] Step 4: "Do you want to run paid ads?" toggle + platform multi-select (Meta, Google, TikTok, LinkedIn Ads)
- [x] Step 4: Content format preferences — multi-select cards (Text, Images, Video) with green checkmarks, all selected by default, at least one required
- [x] "Paid Ads" removed from social channels list (7 organic channels remain)

### App — Marketing Brain Generation
- [x] Anthropic Claude Sonnet 4 integration (real, not mocked)
- [x] Structured JSON output — avatars, social campaigns, ad campaigns (conditional), website kit (conditional)
- [x] Avatars saved to DB with ICPs, pain points, channels
- [x] Social campaigns saved with category='social'
- [x] Ad campaigns saved with category='ad' (retargeting + cold traffic angles)
- [x] Website kit saved as content_pieces (landing page copy, 3 welcome emails, meta description, 3 taglines)
- [x] Brain results page with regenerate functionality
- [x] Fix: Brain page reloads data from DB after first-time generation

### App — Brain Page UI
- [x] Five distinct sections: Target Avatars, Social Campaigns, Ad Campaigns, Email Copy, Website Kit
- [x] Email Copy section separated from Website Kit (email-sequence pieces shown independently)
- [x] Ad Campaigns, Email Copy, and Website Kit sections conditionally shown based on product settings / data
- [x] Colored channel pills (LinkedIn blue, X gray, Reddit orange, etc.)
- [x] TypePill with distinct indigo styling (Text Post, Image Post, Thread, Video Script, etc.)
- [x] Sorted channels A-Z
- [x] Active/Archived status pill + archive/reactivate toggle (admin only)
- [x] Regenerate brain button (admin only)

### App — Content Generation
- [x] Per-campaign content generation (2-3 pieces per campaign via Claude)
- [x] Bulk "Generate All" for social and ad campaigns separately
- [x] Content-type-specific prompts (LinkedIn posts, tweets, threads, video scripts, image prompts, landing pages, emails, ad copy)
- [x] Content format preferences respected — brain prompt dynamically builds content types list from user's selected formats (text/images/video)
- [x] Inline content preview on brain page (expandable)
- [x] Copy-to-clipboard with "Copied!" feedback
- [x] Fix: "Generate All" skips campaigns that already have content (no more duplicates)
- [x] Fix: "Generate All" button shows dynamic label — "Generate Remaining (N)" when some done, "All Generated" when complete
- [x] Fix: Single "Regenerate Content" replaces old pieces instead of appending duplicates (deletes then inserts)

### App — Campaigns Page
- [x] Social / Email / Ads tab bar (Email and Ads tabs shown only when those campaigns exist)
- [x] Email campaigns separated from Social (channel="Email" gets own tab)
- [x] Product and channel/platform filter dropdowns
- [x] Campaign count right-aligned next to tabs (not in filter row)
- [x] Slide-over panel on click (instead of navigating to brain page)
- [x] Panel shows: campaign details, generate/regenerate button (admin), content pieces (compact, click-to-expand)

### App — Content Page
- [x] Category pill tabs: All / Social / Email / Ads / Website (with per-category counts)
- [x] Email separated as its own category (email-sequence pieces, not under Website)
- [x] Product filter dropdown
- [x] Type filter dropdown (all content types including website kit types)
- [x] Status filter dropdown (Draft/Ready/Published)
- [x] Archive icon toggle button (replaces checkbox, with active state styling)
- [x] "Clear filters" button shown when any filter is active
- [x] Filtered count right-aligned on tab row
- [x] Product name prominent on each card
- [x] Campaign angle as subtitle
- [x] Expandable body preview (line-clamp-3)
- [x] Copy-to-clipboard on each piece

### App — Archiving & Status
- [x] Archived is a separate boolean flag, not a status value
- [x] Workflow status (draft/ready/published) preserved when archiving — e.g. "Published, Archived"
- [x] Product archive cascades: sets `archived=true` on all campaigns and content pieces (preserves their workflow status)
- [x] Product reactivate cascades: sets `archived=false` on all campaigns and content pieces
- [x] Archive toggle button on each content piece (content page + campaign panel)
- [x] Archive toggle is exclusive view — shows either active or archived content, not mixed
- [x] Dashboard shows Active Products and Archived Products as separate sections
- [x] Archived products styled dimmer but still visible and clickable on dashboard
- [x] Campaigns page filters out archived campaigns (only shows active)
- [x] Dashboard stats (products, campaigns, content) count only active/non-archived items
- [x] Dedicated Archive page in sidebar nav — shows archived products with expandable campaign details
- [x] Archive page: clickable campaigns open slide-over panel (reuses CampaignPanel) with content pieces
- [x] Archive page: admin "Reactivate Product" button per product

### App — Product Delete (Admin Only)
- [x] `deleteProduct()` server action with admin role check (server-side enforcement)
- [x] ON DELETE CASCADE handles all child records (campaigns, avatars, generations, content_pieces, links, clicks)
- [x] Delete button on brain page header (red, admin-only) with confirmation dialog
- [x] Delete button on dashboard product cards (trash icon, admin-only) with confirmation dialog
- [x] `ProductDeleteButton` client component (handles click interception inside Link wrapper)
- [x] Confirmation modal shows product name, warns about permanent deletion

### App — Role-Based Access
- [x] `getUserWithRole()` in server/auth.ts
- [x] UserContext React context providing `{ email, role }` to all client components
- [x] Dashboard layout wraps children in UserProvider
- [x] Generate/regenerate buttons: admin only (brain page, campaign panel)
- [x] Archive/reactivate, regenerate brain: admin only
- [x] Delete product: admin only (brain page + dashboard)
- [x] Status dropdown (StatusSelect): available to all users
- [x] Non-admin users see "Generated" badge instead of regenerate buttons

### App — Link Tracking & Analytics
- [x] Campaign destination URL — per-campaign URL field with product website_url fallback
- [x] Migration 00007: `destination_url` column on campaigns table
- [x] Tracked link generation — auto-creates unique `/r/{slug}` redirect links when content is generated (if destination URL exists)
- [x] nanoid slug generation (8-char lowercase alphanumeric)
- [x] Auto UTM parameters — utm_source (channel), utm_medium (category), utm_campaign (angle), utm_content (title)
- [x] Redirect endpoint `/r/[slug]` — looks up link in DB, logs click (user agent, referer, IP hash, country, device type), appends UTM params, 302 redirects
- [x] Service role Supabase client for click logging (bypasses RLS per schema design)
- [x] Click counter auto-increment via existing DB trigger (clicks insert → links.click_count++)
- [x] Destination URL input on campaign panel (inline edit with save/cancel)
- [x] Tracked link display on content pieces — both campaign panel and content page (blue mono link + click count + copy button)
- [x] "Tracked" badge on campaign cards when destination URL is set
- [x] Analytics dashboard — summary cards (total clicks, 7-day, 30-day, active links), 30-day bar chart, top 10 links table, clicks by channel with progress bars
- [x] Analytics product filter dropdown
- [x] Content page query includes links data via Supabase FK join

### App — UI Components
- [x] `ChannelPill` — platform-colored (LinkedIn, X, Reddit, Product Hunt, Indie Hackers, Email, Blog, Meta, Google, TikTok, LinkedIn Ads)
- [x] `TypePill` — indigo tint, format-specific labels (Text Post, Thread, Video Script, Image Post, Landing Page, Email Sequence, Meta Description, Tagline, etc.)
- [x] `StatusPill` — active/published (emerald), draft (amber), archived (zinc), ready (blue)
- [x] `StatusSelect` — colored dropdown that looks like a pill but is selectable (Draft/Ready/Published only)
- [x] `ArchivedBadge` — gray "Archived" pill, shown alongside workflow status
- [x] `ArchiveToggle` — archive/unarchive icon button on content pieces
- [x] `CopyButton` — clipboard icon with green checkmark feedback
- [x] `GlowCard` — cursor-following radial gradient glow (marketing site)
- [x] `ProductDeleteButton` — admin-only trash icon with confirmation modal (dashboard product cards)

---

## Things to Test Now

> **Pre-requisite:** Run migration `00007_campaign_destination_url.sql` in Supabase SQL editor before testing.

1. **Campaign destination URL** — Open a campaign in the slide-over panel. Verify:
   - A "Destination URL" section appears below the hook in the panel header
   - Shows "Not set (uses product URL)" when empty, with a pencil edit icon
   - Clicking edit shows an input field with Save/Cancel buttons
   - Entering a URL and saving persists it (close and reopen panel to confirm)
   - Clearing the URL and saving resets to "Not set" state
   - Campaigns page cards show a small blue "Tracked" badge when destination URL is set
2. **Tracked link auto-generation** — Set a destination URL on a campaign, then generate content. Verify:
   - After generation completes, each content piece has a tracked link shown (blue monospace `/r/xxxxx` format)
   - Links display a click count (should be 0 for new links)
   - Copy button next to the tracked link copies the full URL to clipboard
   - The tracked link appears both in the campaign panel (expanded piece) and on the Content page
3. **Tracked link fallback** — On a product that has a `website_url` set but a campaign with NO destination URL:
   - Generate content for that campaign
   - Tracked links should still be created using the product's website URL as the destination
4. **No destination URL** — On a campaign with no destination URL and a product with no website URL:
   - Generate content for that campaign
   - No tracked links should appear (no errors, content generation works normally)
5. **Redirect endpoint** — Copy a tracked link and open it in a new browser tab. Verify:
   - You are redirected to the destination URL
   - The destination URL has UTM parameters appended (utm_source, utm_medium, utm_campaign, utm_content)
   - After clicking, go back to the content piece — click count should increment
6. **Analytics page** — Navigate to Analytics in the sidebar. Verify:
   - Summary cards show: Total Clicks, Last 7 Days, Last 30 Days, Active Links
   - If no links exist, shows an empty state message
   - If links exist with clicks, the 30-day bar chart renders
   - Top Performing Links table shows links sorted by click count with copy buttons
   - Clicks by Channel section shows a breakdown with progress bars
   - Product filter dropdown filters all data to a specific product
7. **Content page — tracked links** — On the Content page, verify:
   - Content pieces with tracked links show the link row (blue link + click count + copy button)
   - Content pieces without tracked links show no link row (no empty/broken state)
   - Links data loads correctly across category filters (Social/Email/Ads/Website tabs)
8. **Existing features still work** — Quick smoke test:
   - Dashboard loads with Active/Archived sections
   - Campaign panel generate/regenerate still works
   - Content status changes and archive toggles still work
   - Archive page still loads and works

---

## What's Next

### Immediate (High Priority)
- [ ] Stripe integration — billing, subscription plans, webhook handler
- [ ] Usage limits by role (free: X products/generations, paid: unlimited)
- [ ] Content calendar view (weekly view of what to post and where)

### Short Term
- [ ] "Mark as posted" tracking on content pieces
- [ ] Performance scoring model (by avatar, angle, channel)
- [ ] Weekly performance summary / digest
- [ ] Assisted posting workflow (copy + reminders)

### Medium Term
- [ ] Self-learning algorithm — feed winning patterns back into content generation
- [ ] Regeneration logic based on top-performing content
- [ ] pgvector embeddings for semantic content similarity
- [ ] Weekly digest emails (Resend/Postmark integration)

### Polish / UX
- [ ] Brain page: edit avatars inline (refine pain points, channels)
- [ ] Content page: bulk status change (select multiple → mark as published)
- [ ] Website kit: structured editing (edit headline, benefits individually instead of raw text)
- [ ] Onboarding flow for new users (guided product creation)
- [ ] Mobile responsive improvements

---

## Database Migrations

| # | File | Description | Status |
|---|---|---|---|
| 00001 | `00001_initial_schema.sql` | Core schema — 10 tables | Applied |
| 00002 | `00002_add_roles_and_waitlist.sql` | User roles + waitlist table | Applied |
| 00003 | `00003_add_generations_update_policy.sql` | Fix: RLS update policy on generations | Applied |
| 00004 | `00004_content_workstreams.sql` | Content workstreams — has_website, wants_ads, campaign categories, expanded content types | Applied |
| 00005 | `00005_separate_archived_flag.sql` | Separate archived from status — archived boolean on campaigns + content_pieces | Applied |
| 00006 | `00006_content_formats.sql` | Content format preferences + remove video-hook — content_formats column on products, migrate video-hook→video-script, update constraints | Applied |
| 00007 | `00007_campaign_destination_url.sql` | Campaign destination URL — destination_url column on campaigns for tracked link generation | Pending |

---

## Key Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-02-10 | Project name: Micro Machine | Working name locked |
| 2026-02-10 | Monorepo with pnpm + Turborepo | Single repo, two Vercel deployments, shared packages |
| 2026-02-10 | Next.js 15 App Router for both apps | Unified stack, server components, API routes |
| 2026-02-10 | Tailwind dark-mode-first | Matches product aesthetic, simpler than toggle |
| 2026-02-10 | Space Grotesk + Inter fonts | Confident headings, clean body text |
| 2026-02-10 | Supabase for DB + Auth | Postgres + Auth + Storage in one service |
| 2026-02-10 | Anthropic as primary LLM, OpenAI for embeddings | Best generation quality + best embedding ecosystem |
| 2026-02-10 | Marketing site = waitlist, App = auth | Marketing captures interest, app handles login/signup |
| 2026-02-10 | User roles: admin / free / paid | Build with roles from the start, only admins use initially |
| 2026-02-10 | Waitlist modal via createPortal | CSS transform on ancestor breaks fixed positioning |
| 2026-02-10 | X/Twitter pill = neutral gray | Blue looked too similar to LinkedIn |
| 2026-02-10 | Content workstreams separation | Social posts (daily), ads (separate strategy), website copy (one-time) are fundamentally different |
| 2026-02-10 | Paid Ads removed from channels → own toggle | Ads are a separate paid strategy, not an organic channel |
| 2026-02-10 | Email stays as social channel | Newsletters/outreach are ongoing; email sequences are website kit deliverables |
| 2026-02-10 | Ad strategy: retargeting + cold traffic | Reuse best social angles for retargeting, dedicated angles for cold traffic |
| 2026-02-10 | Website kit: full kit | Landing page, 3 welcome emails, meta description, 3 taglines |
| 2026-02-10 | Archive only, no delete (original) | CASCADE deletes would destroy all generated content permanently |
| 2026-02-11 | Admin-only delete added | Admins can permanently delete products; cascade handles all child records; confirmation dialog required |
| 2026-02-10 | Status management available to all users | Changing content status (draft/ready/published) is not admin-only |
| 2026-02-10 | Archived is a boolean flag, not a status | Preserves workflow status when archiving — "Published, Archived" instead of losing the original status |
| 2026-02-10 | Product archive cascades via archived flag | Sets archived=true on campaigns + content without touching workflow status |
| 2026-02-11 | Email as its own category | Email campaigns and email sequences separated from Social and Website respectively |
| 2026-02-11 | Pill tabs for category filters | Segmented control (All/Social/Email/Ads/Website) replaces dropdown for cleaner UI |
| 2026-02-11 | Archive icon toggle replaces checkbox | Compact icon button with active state, declutters filter bar |
| 2026-02-11 | Count badge right-aligned, not in filter row | Filtered count visually separated from filter controls to avoid ambiguity |
| 2026-02-11 | Archive toggle = exclusive views | Active and archived content shown separately, not mixed — cleaner mental model |
| 2026-02-11 | Email Copy separated from Website Kit on brain page | Email sequences are a distinct deliverable, not part of the website kit section |
| 2026-02-11 | Video-hook removed, consolidated to video-script | Video scripts already include a hook — separate video-hook type was redundant |
| 2026-02-11 | Content format preferences at intake | Users choose text/images/video at product creation; brain prompt respects selection; default all selected |
| 2026-02-12 | revalidatePath on all mutations | Server actions must invalidate Next.js cache to prevent stale data across page navigation |
| 2026-02-12 | Generate All skips existing content | Bulk generation only targets campaigns without content; prevents duplicate pieces |
| 2026-02-12 | Regenerate replaces, not appends | Single campaign regeneration deletes old pieces first; clean replacement instead of accumulation |
| 2026-02-12 | Dashboard shows active + archived sections | Archived products remain visible on dashboard in a dimmer "Archived Products" section |
| 2026-02-12 | Dedicated Archive page with drill-down | Sidebar nav item; expandable product cards with campaign details and slide-over panel for content |
| 2026-02-12 | Archive page reuses CampaignPanel | Consistent UX — clicking a campaign anywhere opens the same slide-over with content pieces |
| 2026-02-12 | Per-campaign destination URLs with product fallback | Each campaign can have its own landing page; falls back to product website_url when not set |
| 2026-02-12 | Tracked links separate from AI content body | Links displayed as copyable UI element, not embedded in generated text — works for all content types, user places link where they want |
| 2026-02-12 | Auto-generate tracked links on content generation | Links created automatically when content is generated (if destination URL available) — no manual step |
| 2026-02-12 | nanoid 8-char slugs for tracked links | Short, clean, collision-resistant; lowercase alphanumeric only |
| 2026-02-12 | Service role client for click logging | Clicks table has no client-side insert RLS policy by design; service role key bypasses RLS for server-side click inserts |
| 2026-02-12 | Privacy-safe click logging | IP addresses hashed (SHA-256 truncated); country from Vercel header; no PII stored |
| 2026-02-12 | No charting library for v1 analytics | CSS-based bar chart + data tables; keeps bundle small, avoids dependency for simple v1 |
