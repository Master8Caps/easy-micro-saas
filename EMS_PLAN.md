# Easy Micro SaaS — Project Plan

## Project Overview

Easy Micro SaaS is a platform that guides micro-SaaS builders through the full product lifecycle — from finding an idea to getting their first 100 users. The marketing module (Phase 1) turns a simple product brief into a structured early-growth engine.

**Primary audience (initial):** Internal micro-SaaS products built by the team.
**Future audience:** Solo founders, indie hackers, early-stage SaaS teams.
**Domain:** easymicrosaas.com

### What It Does (Marketing Module — Phase 1)

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
- **Marketing site** (`apps/marketing`): Conversion-focused single page, deployed to `easymicrosaas.com`
- **App** (`apps/app`): SaaS application, deployed to `app.easymicrosaas.com`
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
| Email | Resend |

---

## Completed Work

### Infrastructure & Setup
- [x] Monorepo scaffolding (pnpm workspaces + Turborepo)
- [x] Root config: package.json, turbo.json, .gitignore, .npmrc, prettier
- [x] Shared packages: `@repo/config`, `@repo/ui`, `@repo/types`
- [x] Environment variables declared in turbo.json for Vercel builds
- [x] Vercel deployment (two projects — marketing + app)
- [x] Git repo on GitHub (Master8Caps/easy-micro-saas)

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

### Database Hardening
- [x] Migration 00012: Fixed mutable `search_path` on `handle_new_user()` and `increment_click_count()` — `SET search_path = ''`
- [x] Migration 00013: Dropped 4 duplicate indexes (auto-created by UNIQUE constraints + manual CREATE INDEX)
- [x] Migration 00014: Optimised 26 RLS policies — wrapped `auth.uid()` in `(select auth.uid())` for per-query evaluation instead of per-row

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
- [x] "Paid Ads" removed from social channels list
- [x] Step 3: Grouped channel layout — Social Media (LinkedIn, X/Twitter, Facebook, Instagram, TikTok, YouTube, Pinterest), Communities (Reddit, Product Hunt, Indie Hackers), Content & Outreach (Email, Blog/SEO) with 3-column grid

### App — Marketing Brain Generation
- [x] Anthropic Claude Sonnet 4 integration (real, not mocked)
- [x] Structured JSON output — avatars, social campaigns, ad campaigns (conditional), website kit (conditional)
- [x] Avatars saved to DB with ICPs, pain points, channels
- [x] Social campaigns saved with category='social'
- [x] Ad campaigns saved with category='ad' (retargeting + cold traffic angles)
- [x] Ad brain prompt enhanced with proven frameworks (PAS, AIDA, BAB) and platform-specific guidance
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
- [x] Content-type-specific prompts (LinkedIn posts, tweets, Facebook posts, Instagram captions, threads, video scripts, image prompts, landing pages, emails, ad copy)
- [x] Multi-format ad content — ad campaigns generate full creative package (ad copy + image brief + video script) based on content_formats preference; Google ads text-only
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
- [x] Tab counts update dynamically based on active filters
- [x] Campaign count right-aligned next to tabs (not in filter row)
- [x] Campaign-level total click counts shown on cards (when clicks > 0)
- [x] Slide-over panel on click (instead of navigating to brain page)
- [x] Panel shows: campaign details, generate/regenerate button (admin), content pieces (compact, click-to-expand)
- [x] Destination URL display with improved contrast (background box + monospace styling)
- [x] Tracked links appear immediately in panel after content generation

### App — Content Page
- [x] Category pill tabs: All / Social / Email / Ads / Website (with per-category counts)
- [x] Category counts update dynamically based on active filters (product, type, status, archived)
- [x] Email separated as its own category (email-sequence pieces, not under Website)
- [x] Product filter dropdown
- [x] Type filter dropdown (all content types including website kit types)
- [x] Status filter dropdown (Draft/Approved/Scheduled/Posted)
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
- [x] Generate/regenerate content: available to all authenticated users (brain page, campaign panel)
- [x] Archive/reactivate: admin only
- [x] Delete product: admin only (brain page + dashboard)
- [x] Lifecycle actions (LifecycleAction): available to all users

### App — Bulk Status Changes
- [x] `updateContentPiecesStatusBulk()` server action — batch update via Supabase `.in()` filter, single query, RLS enforced
- [x] Checkbox on each content card (left side, indigo highlight when selected)
- [x] Select all button in filter row — selects/deselects all visible (filtered) pieces, partial selection indicator
- [x] Sticky bottom toolbar when items selected — count label, contextual action buttons, clear button
- [x] Approve button — targets draft pieces only
- [x] Schedule button — targets draft + approved pieces, opens DatePicker popover above toolbar
- [x] Mark Posted button — targets scheduled pieces only
- [x] Smart targeting — each action skips pieces already in target or later status
- [x] Selection clears on filter change and after successful bulk action
- [x] Optimistic state updates with rollback on error
- [x] Individual LifecycleAction per card still works independently

### App — Link Tracking & Analytics
- [x] Campaign destination URL — per-campaign URL field with product website_url fallback
- [x] Migration 00007: `destination_url` column on campaigns table
- [x] Tracked link generation — auto-creates unique `/r/{slug}` redirect links when content is generated (if destination URL exists)
- [x] nanoid slug generation (8-char lowercase alphanumeric)
- [x] Redirect endpoint `/r/[slug]` — looks up link in DB, logs click (user agent, referer, IP hash, country, device type), clean 302 redirect (no UTM params — internal tracking handles attribution)
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
- [x] `StatusPill` — active/published (emerald), draft (amber), archived (zinc), approved (blue), scheduled (violet), posted (emerald)
- [x] `LifecycleAction` — unified status badge + next-action button + revert dropdown (replaces StatusSelect + PostedToggle)
- [x] `DatePicker` — custom dark-themed calendar popover with month nav, time slot grid (30-min intervals 06:00–21:00), confirm button, today/selected highlights
- [x] `ArchivedBadge` — gray "Archived" pill, shown alongside workflow status
- [x] `ArchiveToggle` — archive/unarchive icon button on content pieces
- [x] `CopyButton` — clipboard icon with green checkmark feedback
- [x] `GlowCard` — cursor-following radial gradient glow (marketing site)
- [x] `ProductDeleteButton` — admin-only trash icon with confirmation modal (dashboard product cards)

### Instagram Content Type Fix
- [x] Removed `instagram-caption` content type — Instagram is visual-first, captions alone don't make sense
- [x] Instagram campaigns now generate `image-prompt` and `video-script` types instead
- [x] `getFormatInstructions()` is channel-aware — Instagram-specific guidance for Reels and image posts
- [x] Brain prompt instruction #6: "For Instagram campaigns, ALWAYS use image-prompt or video-script content types"
- [x] Migration 00008: CHECK constraint updated, `facebook-post` added
- [x] UI references to `instagram-caption` removed from pills and content-list type options

### Marketing Site Redesign
- [x] Full visual redesign aligned to SITE Framework positioning document
- [x] Typography: Outfit (headings) + DM Sans (body) replacing Space Grotesk + Inter
- [x] Accent: indigo/violet gradient (`#818cf8 → #a78bfa`) replacing blue/cyan
- [x] Problem-led hero: "You shipped. Now what?" with gradient text
- [x] Problem section: 3 GlowCards with SVG icons per pain point
- [x] Value Exchange section replacing generic features list — "Do X → Get Y" format
- [x] How It Works: 3-step process with continuous indigo/violet gradient line
- [x] Proof section: stats + testimonial in GlowCards
- [x] CTA: "Stop guessing. Start growing." with time/effort clarity
- [x] Sticky navbar with backdrop blur on scroll, "Get Early Access" CTA
- [x] All CTAs unified to "Get Early Access"
- [x] AnimateOnScroll (IntersectionObserver) for section reveal animations
- [x] GlowCard component restored with indigo accent cursor glow
- [x] Brand name: "Easy Micro SaaS" throughout

### Dashboard Visual Refresh
- [x] Typography: Outfit (headings) + DM Sans (body) — matching marketing site
- [x] Card surfaces standardized: `border-white/[0.06] bg-white/[0.02]` with `hover:border-white/[0.1] hover:bg-white/[0.03]`
- [x] Sidebar redesign: indigo/violet logo gradient, icon nav per item, left border active state (`border-l-2 border-indigo-400`)
- [x] All blue accents replaced with indigo (chart bars, tracked links, focus rings, link icons)
- [x] Input focus states: `focus:border-indigo-500/50 focus:ring-indigo-500/30`
- [x] Loading spinners standardized: `border-indigo-400/30 border-t-indigo-400`
- [x] Empty state borders: `border-dashed border-white/[0.08]`
- [x] Page headers: `tracking-tight` titles, `text-zinc-500` subtitles
- [x] Section labels: uppercase `tracking-wider` style
- [x] Card padding standardized to `p-6`
- [x] Dashboard favicon updated to rocket + sparkle icon
- [x] Dark-themed dropdown styling (`bg-zinc-900 [&>option]:bg-zinc-900`) across all 4 dashboard pages with `<select>` elements
- [x] 19 files updated across all dashboard pages (home, campaigns, content, analytics, archive, products/new, products/brain)

### App — Content Calendar / Schedule
- [x] `posted_at` TIMESTAMPTZ and `scheduled_for` TIMESTAMPTZ columns on content_pieces
- [x] Migration 00010: columns with partial indexes for efficient filtering
- [x] Migration 00015: `scheduled_for` converted from DATE to TIMESTAMPTZ (existing dates migrated to 09:00 UTC)
- [x] `updateContentPieceSchedule()` server action — sets scheduled_for timestamp or null, auto-sets status to `scheduled`/`approved`
- [x] New `/schedule` page — server component with week range calculation
- [x] Week navigation via `?week=N` query param (0 = current week, -1 = last week, +1 = next week)
- [x] Fixed endDate boundary for TIMESTAMPTZ queries (`T23:59:59.999Z`)
- [x] Two Supabase queries: scheduled pieces for the week + unscheduled active pieces (limit 50)
- [x] `ScheduleCalendar` client component — 7-column grid (Mon–Sun) with day headers
- [x] Today's column highlighted with indigo border
- [x] Past dates with dimmed day numbers
- [x] Compact calendar cards: channel pill, title, product name, lifecycle status, time label, click to expand
- [x] Pieces sorted by time within each day
- [x] Date grouping extracts date with `.split("T")[0]` from TIMESTAMPTZ
- [x] Expanded cards show: TypePill, full body text, copy button, unschedule (X) button
- [x] "Back to this week" link when navigating away from current week
- [x] Unscheduled Content pool below calendar with product filter dropdown
- [x] Optimistic state updates on schedule/unschedule (instant UI feedback)
- [x] Schedule added to sidebar nav between Content and Analytics with calendar icon
- [x] Fix: Removed duplicate Schedule/Approve buttons from UnscheduledCard (LifecycleAction is single source)
- [x] Fix: `handleLifecycleChange` moves pieces between unscheduled/scheduled arrays

### App — Unified Content Lifecycle
- [x] Linear lifecycle: Draft → Approved → Scheduled → Posted (with shortcuts — scheduling a draft auto-approves, posting approved content skips scheduled)
- [x] Migration 00011: status constraint updated from `('draft', 'ready', 'published')` to `('draft', 'approved', 'scheduled', 'posted')` with data migration
- [x] `updateContentPieceStatus()` reworked — handles all transitions with side-effect management (clears/sets `posted_at` and `scheduled_for` as appropriate)
- [x] `markContentPiecePosted()` removed — absorbed into `updateContentPieceStatus('posted')`
- [x] `LifecycleAction` component — unified status badge + contextual next-action button + revert dropdown
  - Draft (amber) → "Approve" button
  - Approved (blue) → "Schedule" button (opens DatePicker with time selection)
  - Scheduled (violet, shows date + time) → "Mark Posted" button
  - Posted (emerald, shows date + time) → done state with "Undo post" revert
  - Revert dropdown: Back to Draft, Unschedule, Change date, Undo post
- [x] `formatDateTime` helper shows date + time (e.g. "Feb 17 9:00 AM")
- [x] Custom `DatePicker` component — dark-themed calendar + time slot grid
  - Month navigation, 7-column Mon–Sun grid, today/selected highlights
  - 30-minute time slots from 06:00–21:00 (32 slots), defaults to 9:00 AM
  - Clicking a day selects it and shows time grid (doesn't close picker)
  - Confirm button with date+time summary
  - `onChange` emits full ISO timestamp
  - Click-outside-to-close and Escape key support
  - Styled to match design system (zinc-900 bg, indigo highlights)
- [x] Content page: LifecycleAction replaces StatusSelect + PostedToggle + PostedBadge
- [x] Content page: status filter updated to Draft/Approved/Scheduled/Posted
- [x] Content page: posted content dimmed to 60% opacity
- [x] Campaign panel: LifecycleAction replaces StatusSelect + PostedToggle
- [x] Schedule calendar: LifecycleAction on unscheduled cards; calendar cards open slide-over panel
- [x] Schedule calendar: custom DatePicker replaces native `<input type="date">`
- [x] Schedule calendar: compact calendar cards (channel pill, time, title, product, status dot) — click opens slide-over panel
- [x] Schedule calendar: slide-over panel with full content body, lifecycle action, copy button, unschedule button
- [x] DatePicker and revert dropdown positioned right-aligned (prevents overflow on right-placed triggers)
- [x] LifecycleAction uses flex-wrap and truncate for narrow containers
- [x] `StatusSelect` component removed from pills.tsx (replaced by LifecycleAction)
- [x] `PostedToggle` / `PostedBadge` components deleted (replaced by LifecycleAction)
- [x] `StatusPill` updated with new lifecycle status colors (approved=blue, scheduled=violet, posted=emerald)
- [x] Optimistic local state updates with server rollback on error
- [x] Server action validation: `isNaN(new Date(scheduledFor).getTime())` guard on scheduling

### Email Integration (Resend)
- [x] Resend package installed in both apps (`apps/app`, `apps/marketing`)
- [x] Resend client singleton (`apps/app/lib/resend.ts`) — shared instance + `EMAIL_FROM` constant
- [x] `RESEND_API_KEY` added to `turbo.json` env array for Vercel builds
- [x] Shared email template wrapper — dark theme (#09090b bg, zinc-900 card, rocket logo, indigo accents, 480px max-width)
- [x] Inline SVGs replaced with hosted `<img>` tag for Gmail/Outlook compatibility
- [x] SVG logo replaced with PNG (`logo.png`) — SVGs not supported in Gmail/Outlook; 80x80 PNG generated via sharp, hosted at `easymicrosaas.com/logo.png`
- [x] **Waitlist confirmation email** (`sendWaitlistConfirmation`) — "You're on the list" with what-happens-next card
- [x] **Account activation email** (`sendActivationEmail`) — "Your account is ready" with indigo sign-in CTA button
- [x] **Admin activation action** (`activateUser`) — verifies caller is admin, updates `profiles.status = 'active'`, looks up email via `auth.admin.getUserById`, sends activation email
- [x] App waitlist trigger — `addToWaitlist()` checks for existing entry, only sends confirmation for new signups (fire-and-forget)
- [x] Marketing site waitlist trigger — `route.ts` checks for existing entry, sends inline HTML confirmation for new signups (fire-and-forget with `.catch()`)
- [x] **Supabase email templates** — 6 branded HTML templates in `supabase/templates/` for dashboard configuration:
  - `confirm-signup.html` — "Confirm your email" with verification button
  - `reset-password.html` — "Reset your password" with safety note
  - `magic-link.html` — "Your sign-in link" with expiry note
  - `invite-user.html` — "You've been invited" with product description
  - `change-email.html` — "Confirm email change" with security warning
  - `reauthentication.html` — "Verify your identity" with large monospace OTP code display
- [x] All templates use consistent branded design (dark bg, indigo CTA buttons, zinc card, hosted logo, matching footer)

### App — Waitlist Gate
- [x] New sign-ups gated behind waitlist — users see "You're on the list" instead of dashboard
- [x] Two-dimensional access model: `status` (waitlist/active) + `role` (free/paid/admin)
- [x] Migration 00009: `status` column on profiles (default `waitlist`), existing users set to `active`
- [x] `handle_new_user()` trigger sets `status = 'waitlist'` for new accounts
- [x] Dashboard layout redirects `status === 'waitlist'` users to `/waitlist` page
- [x] Waitlist page (`/waitlist`): server component with auth check, shows holding message, sign-out button
- [x] Login page: after signup, shows waitlist confirmation with email and "What happens next?" card
- [x] `addToWaitlist()` server action inserts into waitlist table with source `app-signup`
- [x] `getUserWithRole()` now returns `status` alongside `role`
- [x] To grant access: change user's status from `waitlist` to `active` in Supabase
- [x] Login page form inputs polished with new design language (indigo focus states)
- [x] Fix: Middleware skip redirect for server actions (`next-action` header check) — was causing waitlist insert to fail silently

### App — Inline Avatar Editing
- [x] Brain page reads avatars from `avatars` DB table instead of frozen `generation.raw_output` JSONB
- [x] `updateAvatar()` server action — auth check, updates name/description/pain_points/channels/icp_details, RLS enforced, `revalidatePath`
- [x] `AvatarEditPanel` slide-over component — form with name, description, pain points (add/remove), channel toggles, ICP details (role/context/motivation)
- [x] Pencil edit icon on avatar cards (visible on hover)
- [x] Pain points: editable list with per-item text input + remove button + "Add pain point"
- [x] Channels: toggleable pill grid of all 12 known channels, indigo highlight when selected
- [x] ICP details: role text input, context and motivation textareas, inside bordered card
- [x] Validation: name required, at least 1 pain point, at least 1 channel
- [x] Save updates DB and closes panel, card reflects changes immediately
- [x] Old avatars deactivated (`is_active = false`) on brain regeneration — prevents stale + new duplicates
- [x] `getAvatarName()` refactored to use `avatar_id` FK instead of brittle angle matching on raw_output
- [x] Escape key and backdrop click close the panel

### App — Admin Dashboard
- [x] `/admin` page — admin-only system overview with platform-wide stats
- [x] `loadSystemStats()` server action — 7 parallel aggregate count queries via service client (users, products, generations, content, clicks)
- [x] Summary cards: Total Users, Active Users, Waitlisted, Total Products, Generations, Content Pieces, Total Clicks, Generations (7d)
- [x] Recent signups table (last 10) — email, status badge, source, date
- [x] `/admin/users` page — user management (moved from `/admin`)
- [x] `loadAdminUsers()` server action — admin check, merges auth users + profiles + waitlist data via service client
- [x] Waitlist table: email, name, source, signup date, "Activate" button per user
- [x] Active users table: email, role badge (admin=indigo, paid=emerald, free=zinc), join date
- [x] Activate button calls existing `activateUser()` — updates profile status, sends activation email via Resend
- [x] **Invite user** — email input + "Invite" button on users page
- [x] `inviteUser()` server action — admin check, calls `auth.admin.inviteUserByEmail()`, sets profile to `invited` (pending until setup), Supabase sends branded invite template
- [x] Optimistic UI: activated user moves from waitlist to active table immediately
- [x] Loading spinner on activate button while action is in flight
- [x] Non-admins redirected to `/` on page load
- [x] **Invite setup flow** — invited users redirected to `/setup` page (not dashboard) to set name + password before first use
- [x] `/setup` page: standalone client component with Full Name, Password, Confirm Password fields
- [x] Password set via `supabase.auth.updateUser({ password })` (no current password needed — active session from invite link)
- [x] Profile name saved via existing `updateProfile()` server action
- [x] Invite email: raw Supabase URL hidden — fallback link replaced with "click here to accept your invitation" hyperlink
- [x] Sidebar admin section: separator + "ADMIN" label + System (/admin) + Users (/admin/users) — conditional on admin role
- [x] Sidebar order: Admin section above Settings, Settings directly above signed-in user info
- [x] Sidebar stays fixed in viewport — `h-screen` layout with `overflow-y-auto` on both sidebar and main content
- [x] Empty states for both tables with dashed border styling
- [x] **Pending invites tracking** — invited users start with `status: 'invited'` instead of immediately `active`
- [x] Migration 00017: added `invited` to `profiles.status` check constraint (`waitlist | invited | active`)
- [x] `loadAdminUsers()` returns 3 groups: waitlisted, invited, active
- [x] New "Pending Invites" section on admin users page (sky-blue badge) — shows email + invited date
- [x] `activateInvitedUser()` server action — transitions `invited` → `active` on setup completion
- [x] `/setup` page calls `activateInvitedUser()` after password + name set — auto-activates invited users
- [x] Resend client lazy-initialized (`getResend()`) to prevent build-time errors on server components importing admin actions

### App — User Settings Page
- [x] `/settings` page — account management for all authenticated users
- [x] Server component loads profile data (`full_name`, `avatar_url`), passes to client form
- [x] **Profile section** — initials-based avatar circle (from `full_name`) + Full Name text input
- [x] `updateProfile()` server action — auth check, updates `profiles.full_name`, RLS enforced, `revalidatePath`
- [x] **Email section** — shows current email (read-only), new email input, client-side `supabase.auth.updateUser({ email })` triggers confirmation flow
- [x] **Password section** — current password + new password + confirm password inputs
- [x] `updatePassword()` server action — verifies current password via `signInWithPassword`, then `updateUser({ password })`
- [x] Client-side validation: password match check, min 6 chars
- [x] Per-section independent state (saving, error, success) — sections don't interfere with each other
- [x] Success messages auto-dismiss after 4 seconds
- [x] "Settings" nav item in sidebar — gear icon, shown for all users, pinned to bottom of sidebar
- [x] Design matches existing dashboard patterns (card surfaces, indigo focus states, loading spinners)

### App — Performance Scoring Model
- [x] `loadPerformanceScores()` server action — computes scores from existing `links.click_count` data, no new DB tables
- [x] Three scoring dimensions: campaign (click total), avatar (aggregate from campaigns), channel (aggregate from campaigns)
- [x] Normalized 0-100 scale relative to top performer within each dimension
- [x] Score tiers: Top performer (emerald), Moderate (amber), Low (orange), Underperforming (red), No data (zinc)
- [x] Period filtering: All time, 30 days, 7 days — uses `clicks` table for period-filtered counts
- [x] Brain page: performance progress bar + tier label + click count on each avatar card
- [x] Brain page: thin progress bar + click count on each campaign card (when tracked links exist)
- [x] Brain page: period toggle (All time / 30 days / 7 days) next to "Target Avatars" heading
- [x] Analytics page: "Performance Scores" section — 3-column grid (By Avatar, By Channel, Top Campaign Angles) — shown when product selected
- [x] Analytics page: loading spinner while performance data loads, empty state when no click data
- [x] Shared `score-utils.ts` — `getScoreTier()`, `scoreBarColor()`, `scoreTextColor()` used by both pages

### App — Sidebar Fixes
- [x] Sidebar stays fixed in viewport — `h-screen` layout with `overflow-y-auto` on sidebar and main content
- [x] Admin section moved above Settings — order: main nav → Admin → Settings → user info
- [x] Settings directly above signed-in user email/sign-out for all users

### App — Self-Learning System (v1)
- [x] Migration 00016: rating + engagement columns on content_pieces (rating, engagement_views/likes/comments/shares, engagement_logged_at)
- [x] `updateContentRating()` server action — thumbs up/down (-1/0/1) on any content piece
- [x] `updateContentEngagement()` server action — views, likes, comments, shares with timestamp
- [x] Composite scoring — clicks (40%) + engagement (40%) + rating (20%), normalized 0-100
- [x] Engagement sub-weights: views ×1, likes ×3, comments ×5, shares ×4
- [x] `computeEngagementRaw()` and `computeCompositeScore()` helpers in score-utils.ts
- [x] `loadPerformanceScores()` updated to use composite scoring (fetches content pieces with engagement/rating alongside links)
- [x] `loadLearningInsights()` — pattern extraction from scored content (top performers, patterns, underperformers, thumbs-down)
- [x] Brain generation enhanced — `buildPerformanceContext()` injected into prompt when insights available
- [x] Content generation enhanced — `buildContentPerformanceContext()` injected into prompt with top-performing examples
- [x] Cold start: no context when zero data; sparse data (<5 pieces) gets directional caveat
- [x] `RatingButtons` component — thumbs up/down on content cards with optimistic updates
- [x] `EngagementPopover` component — log views/likes/comments/shares on posted content with popover form
- [x] Rating buttons on content page, campaign panel, and schedule page (all lifecycle stages)
- [x] Engagement popover on content page, campaign panel, and schedule page (posted pieces only)
- [x] Performance bars on brain page show composite scores (not just clicks)
- [x] `loadContentForCampaign` query updated to include new columns
- [x] Content page and schedule page server queries updated to include new columns

### Rebrand: Easy Micro SaaS
- [x] GitHub repo renamed from `micro-machine` to `easy-micro-saas`
- [x] Git remote URL updated
- [x] All "Micro Machine" text → "Easy Micro SaaS" across both apps
- [x] Metadata titles updated in both layout.tsx files
- [x] Favicon: rocket + sparkle icon (indigo rocket body, violet fins/exhaust, 4-point sparkles)
- [x] All inline SVG logos updated across 7 files (sidebar, login, waitlist, navbar, footer, both icon.svg)

---

## Test Checklist

### Link Tracking (from 2026-02-13)

> Migrations 00001–00015 — Applied.

#### Passed
1. **Campaign destination URL** — Destination URL section appears in panel, edit/save/clear all work, "Tracked" badge shows on campaign cards.
2. **Tracked link auto-generation** — Links generate correctly and appear immediately in panel.
3. **Tracked link fallback** — Product website_url used when campaign has no destination URL.
5. **Redirect endpoint** — Clean 302 redirect + click count updates confirmed.
6. **Analytics page** — Summary cards, chart, top links table, channel breakdown, product filter all working.
7. **Content page — tracked links** — Link rows display correctly with click counts and copy buttons.
8. **Existing features** — Dashboard, generate/regenerate, status changes, archive toggles, archive page all working.

#### Still to Test
4. **No destination URL** — Confirm no tracked links generated when neither campaign nor product has a URL.

### Instagram Content Type Fix

> Migration `00008_expand_content_types.sql` — Applied.

- [x] Generate brain for a product with Instagram channel selected
- [x] Verify campaigns use `image-prompt` or `video-script` (not `instagram-caption`)
- [x] Generate content for an Instagram campaign — check format instructions are Instagram-specific

### Marketing Site Redesign

- [x] Visit marketing site — hero loads with "You shipped. Now what?"
- [x] Problem section: 3 equal-height GlowCards with hover glow effect
- [x] Value Exchange section: "Do X → Get Y" cards with arrows
- [x] How It Works: 3 steps with continuous gradient line (line doesn't go through numbers)
- [x] All CTAs say "Get Early Access" (navbar, hero, CTA section)
- [x] Waitlist modal opens, submits, shows success state
- [x] Favicon is rocket + sparkle icon
- [x] Mobile responsive — check at 375px, 768px breakpoints

### Dashboard Visual Refresh

- [x] Sidebar: indigo/violet logo, icon nav items, left border active state
- [x] Dashboard home: stat cards hover, product cards hover, correct surfaces
- [x] Campaigns: tab bar styled, campaign cards have new surfaces, indigo tracked link icons
- [x] Campaign panel: refined borders, indigo spinner, tracked links in indigo (not blue)
- [x] Content: tab bar, filters, content cards all use new surfaces
- [x] Analytics: indigo chart bars, indigo channel progress bars, summary cards with uppercase labels
- [x] Products/new: form inputs have indigo focus rings, step indicator uses new colors
- [x] Products/brain: indigo loading spinner, all cards use new surfaces, content preview bg
- [x] Archive: product cards and campaign inner cards use new surfaces
- [x] Delete modal (both dashboard + brain page): dark bg (`bg-zinc-950`), new border style
- [x] Login page: form inputs have indigo focus rings
- [x] No remaining blue accents anywhere in dashboard
- [x] All `<select>` dropdowns use dark styling (`bg-zinc-900`)

### Waitlist Gate

> Migration `00009_add_profile_status.sql` — Applied.

- [x] Sign up with a new email → see "You're on the list" screen (not the dashboard)
- [x] Sign out from waitlist screen → returns to login
- [x] Sign back in with that email → lands on `/waitlist` page (not dashboard)
- [x] Activate user from admin dashboard (or Supabase) → sign in → dashboard loads
- [x] Existing admin/paid users completely unaffected (still access dashboard)
- [x] Waitlist table has a new row with source `app-signup` for the test signup — **fixed: middleware was redirecting server actions**

### Content Calendar / Schedule

> Migrations `00010_posted_and_scheduling.sql` + `00015_scheduled_for_timestamptz.sql` — Applied.

- [x] Schedule appears in sidebar nav between Content and Analytics
- [x] `/schedule` page loads with current week (Mon–Sun)
- [x] Today's column has indigo border highlight
- [x] Navigate to previous/next week → URL updates, content changes
- [x] "Back to this week" link appears when viewing other weeks
- [x] Unscheduled Content section shows active unscheduled pieces
- [x] Click "Schedule" on an unscheduled card → DatePicker opens with calendar + time grid, pick date + time → piece moves to calendar
- [x] Time defaults to 9:00 AM, can be changed in 30-min increments
- [x] Calendar cards show time label (e.g. "9:00 AM") sorted by time within each day
- [x] Click calendar card → slide-over panel opens with full body, lifecycle action, copy button, unschedule
- [x] Unschedule from panel → piece returns to unscheduled pool
- [x] Product filter in unscheduled section works
- [x] LifecycleAction works on unscheduled cards (calendar cards use panel)
- [x] Empty days show "No content" placeholder

### Unified Content Lifecycle

> Migration `00011_unified_lifecycle.sql` — Applied.

- [x] Content page: Draft pieces show amber "Draft" badge + "Approve" button
- [x] Click "Approve" → badge turns blue "Approved", "Schedule" button appears
- [x] Click "Schedule" → DatePicker opens with calendar + time grid, pick date + time → badge turns violet "Scheduled · Feb 20 9:00 AM"
- [x] Click "Mark Posted" on scheduled piece → badge turns emerald "Posted · Feb 16 9:00 AM"
- [x] Click status badge to reveal revert dropdown:
  - [x] Approved → "Back to Draft" works
  - [x] Scheduled → "Unschedule" (→ approved) and "Change date" work
  - [x] Posted → "Undo post" (→ scheduled or approved) works
- [x] Content page status filter: Draft / Approved / Scheduled / Posted all filter correctly
- [x] Posted content cards are dimmed (60% opacity)
- [x] Campaign panel: LifecycleAction on each content piece works
- [x] Schedule page: LifecycleAction on calendar cards and unscheduled cards
- [x] Schedule page: custom DatePicker on unscheduled cards (not native date input)
- [x] DatePicker: month navigation, today highlighted, time grid (30-min slots), confirm button, click outside to close, Escape to close
- [x] Category counts update correctly with status filter active

### Email Integration (Resend)

- [x] Add `RESEND_API_KEY` to `apps/app/.env.local` and both Vercel projects (app + marketing)
- [x] Verify `easymicrosaas.com` domain is verified in Resend dashboard
- [x] Sign up with new email on marketing site → check inbox for "You're on the list" email
- [x] Sign up with new email on app → check inbox for "You're on the list" email
- [x] Duplicate signup on either site → no second email sent
- [x] Run `activateUser()` for a waitlisted user → check inbox for "Your account is ready" email
- [x] Click "Sign in to your account" button in activation email → lands on login page — **fixed: link pointed to old Vercel URL, need to update `NEXT_PUBLIC_APP_URL` in Vercel**
- [x] Configure Supabase Custom SMTP (Resend SMTP credentials)
- [x] Paste branded templates into Supabase dashboard (all 6 template slots) — **re-paste needed: templates now use `logo.png` instead of `favicon.svg`**
- [ ] Test password reset → branded "Reset your password" email arrives
- [ ] Test email confirmation (if enabled) → branded "Confirm your email" arrives
- [x] Fix: SVG logo replaced with PNG (`logo.png`) across all 8 email templates — SVGs don't render in Gmail/Outlook

### Inline Avatar Editing

- [ ] Open brain page for a product with generated avatars
- [ ] Hover over avatar card → pencil edit icon appears (top-right)
- [ ] Click edit icon → slide-over panel opens with all fields pre-populated
- [ ] Edit name → save → card shows updated name
- [ ] Edit description → save → card shows updated description
- [ ] Remove a pain point (X button) → save → point removed from card
- [ ] Add a pain point ("+ Add pain point") → type text → save → new point appears on card
- [ ] Toggle channels on/off → save → channel pills update on card
- [ ] Edit ICP details (role, context, motivation) → save → ICP box updates on card
- [ ] Refresh page → all changes persist (loaded from DB, not raw_output)
- [ ] Try saving with empty name → validation error shown
- [ ] Try saving with no pain points → validation error shown
- [ ] Try saving with no channels → validation error shown
- [ ] Escape key closes panel without saving
- [ ] Backdrop click closes panel without saving
- [ ] Regenerate brain → new avatars replace old ones, edit still works on new avatars
- [ ] Generate content for a campaign → content uses updated avatar data (pain points, description, etc.)

### Admin Dashboard

- [x] Log in as admin → "Admin" section appears in sidebar with separator, label, System + Users links
- [ ] Log in as non-admin → Admin section does NOT appear in sidebar
- [ ] Visit `/admin` as non-admin → redirected to `/`
- [ ] Visit `/admin` as admin → see summary stat cards + recent signups table
- [ ] Stat cards show correct counts (total users, active, waitlisted, products, generations, content, clicks, 7d generations)
- [ ] Recent signups table shows last 10 users with status badges
- [ ] Visit `/admin/users` → see invite form + pending invites + waitlist table + active users table
- [x] Waitlist table shows email, name, source, signup date for each waitlisted user
- [x] Active users table shows email, role badge (colored), join date
- [x] Click "Activate" on a waitlisted user → spinner shows, user moves to active table
- [x] Activated user receives "Your account is ready" email
- [x] Activated user can now log in and see the dashboard (no longer gated)
- [ ] Invite user: enter email + click Invite → success message, user receives branded invite email
- [ ] Invite email: no raw Supabase URL visible — fallback shows "click here to accept your invitation" hyperlink
- [ ] Invited user clicks "Accept invitation" → lands on `/setup` page (not dashboard)
- [ ] `/setup` page: enter name + password → "Complete setup" → redirects to dashboard
- [ ] Sign out, then sign in with email + new password → works
- [ ] `/setup` page: mismatched passwords → error shown
- [ ] `/setup` page: password < 6 chars → error shown
- [ ] Invite duplicate email → error message shown
- [ ] Invite user → new user appears in "Pending Invites" section (not Active Users)
- [ ] Pending Invites section shows sky-blue count badge with correct number
- [ ] Pending Invites table shows email and invited date for each pending user
- [ ] Invited user clicks email link → completes `/setup` → moves from Pending Invites to Active Users
- [ ] After setup completion, user no longer appears in Pending Invites on next page load
- [ ] Empty Pending Invites shows "No pending invitations" placeholder
- [ ] Empty waitlist shows "No users on the waitlist" placeholder
- [ ] User counts (badges) on all three sections are correct (pending, waitlist, active)
- [ ] Settings appears directly above user info at bottom of sidebar (below Admin section)
- [ ] Admin section appears above Settings (order: main nav → Admin → Settings → user info)

### Sidebar Layout

- [ ] Sidebar stays fixed when scrolling long page content (e.g. content page with many items)
- [ ] Sidebar does not scroll with the page — only main content area scrolls
- [ ] If sidebar content exceeds viewport height, sidebar scrolls independently
- [ ] Admin section (System + Users) appears above Settings for admin users
- [ ] Settings appears directly above the signed-in user email/sign-out for all users
- [ ] Non-admin users see: main nav → Settings → user info (no Admin section)

### User Settings Page

- [ ] "Settings" appears at bottom of sidebar directly above user info for all users
- [ ] `/settings` page loads with current name and email pre-populated
- [ ] Initials avatar displays correctly (derived from full name)
- [ ] Update full name → save → success message, refresh persists
- [ ] Clear full name → save → avatar shows "?" fallback
- [ ] Enter new email → "Update Email" → confirmation message shown
- [ ] Check inbox → confirmation link arrives for email change
- [ ] Enter wrong current password → error "Current password is incorrect"
- [ ] New password < 6 chars → validation error
- [ ] New password and confirm don't match → validation error
- [ ] Enter correct current + valid new password → success, fields clear
- [ ] Log out and back in with new password → works
- [ ] Each section operates independently (saving profile doesn't affect password state)

### Bulk Status Changes

- [ ] Checkbox appears on each content card (left side)
- [ ] Clicking checkbox selects card (indigo border highlight)
- [ ] Select all button in filter row selects all visible pieces
- [ ] Select all shows partial indicator (dash) when some selected
- [ ] Sticky toolbar appears at bottom when items selected — shows count
- [ ] Approve button shown when any selected piece is draft
- [ ] Schedule button shown when any selected piece is draft/approved — opens DatePicker
- [ ] Mark Posted button shown when any selected piece is scheduled
- [ ] Bulk approve: only draft pieces change to approved (others untouched)
- [ ] Bulk schedule: drafts + approved pieces all become scheduled with chosen date/time
- [ ] Bulk mark posted: only scheduled pieces become posted
- [ ] Selection clears after successful action
- [ ] Selection clears when filters change
- [ ] Individual LifecycleAction on each card still works alongside bulk

### Performance Scoring Model

#### Brain Page
- [ ] Open brain page for a product with tracked links + clicks → avatar cards show performance section (progress bar, tier label, click count)
- [ ] Campaign cards show thin performance bar + click count (only for campaigns with tracked links)
- [ ] Campaigns with no tracked links show no performance bar (no "0 clicks" clutter)
- [ ] Period toggle appears next to "Target Avatars" heading (All time / 30 days / 7 days)
- [ ] Switch to "7 days" → scores update to reflect only recent clicks
- [ ] Switch to "30 days" → scores update to reflect last 30 days of clicks
- [ ] Switch back to "All time" → scores reflect all-time click totals
- [ ] Top performer avatar shows emerald bar (score ~100)
- [ ] Lower-performing avatars show proportionally shorter bars (amber/orange/red)
- [ ] Avatar cards show "Best: [channel name]" for the top-performing channel per avatar
- [ ] Product with no click data → no performance sections shown on any card
- [ ] Product with no tracked links at all → no performance bars anywhere (graceful)

#### Analytics Page
- [ ] Select a product in dropdown → "Performance Scores" section appears below existing analytics
- [ ] Performance section shows 3-column grid: By Avatar, By Channel, Top Campaign Angles
- [ ] Each item shows name, click count, and colored progress bar
- [ ] Top performers have emerald bars, lower performers have amber/orange bars
- [ ] Campaign angles list shows top 8 campaigns sorted by score
- [ ] No product selected → performance section hidden
- [ ] Product with clicks → scores load with loading spinner, then display
- [ ] Product with no clicks → "No performance data yet" empty state message
- [ ] Switch between products → scores update for the newly selected product

### Self-Learning System

> Migration 00016 — Applied.

#### Rating
- [ ] Thumbs up button on content card → turns green, saves to DB
- [ ] Click thumbs up again → clears rating (back to neutral)
- [ ] Thumbs down button → turns red, saves to DB
- [ ] Rating available on draft, approved, scheduled, and posted pieces
- [ ] Rating appears on content page, campaign panel, and schedule page
- [ ] Refresh page → rating persists

#### Engagement Tracking
- [ ] "Log engagement" button appears only on posted content pieces
- [ ] Click button → popover opens with 4 number inputs
- [ ] Enter values → save → popover closes, button shows summary
- [ ] Re-open popover → values pre-populated
- [ ] Update values → save → summary updates
- [ ] Partial input works (only fill in likes, leave others empty)
- [ ] Click outside popover → closes without saving
- [ ] Escape key → closes without saving

#### Composite Scoring
- [ ] Brain page: avatar performance bars reflect composite score (not just clicks)
- [ ] Brain page: campaign performance bars reflect composite score
- [ ] Performance bars update when engagement is logged
- [ ] Performance bars update when rating is given
- [ ] Period toggle still works (All time / 30d / 7d)
- [ ] Product with only engagement data (no clicks) still shows scores
- [ ] Product with only ratings (no clicks, no engagement) still shows scores

#### Learning / Regeneration
- [ ] Regenerate brain with performance data → prompt includes performance context
- [ ] Regenerate brain with sparse data (<5 pieces) → includes directional caveat
- [ ] Regenerate brain with zero data → prompt unchanged (no performance context)
- [ ] Regenerate content with performance data → prompt includes top-performing examples
- [ ] Thumbs-downed content noted in "what to avoid" section of prompt
- [ ] Generated content shows influence of performance data (different angles/tone vs cold start)

---

## What's Next

### Immediate (Next Up)
1. ~~**Self-learning system (v1)** — rating, engagement tracking, composite scoring, pattern extraction into regeneration prompts~~ **Done**
2. ~~**Regeneration logic based on top-performing content** — performance context injected into brain + content generation prompts~~ **Done**
3. **Meta Ad Library API integration** — pull winning ads as reference for ad generation (filter by longevity as proxy for success)
4. **Weekly performance summary / digest** — scheduled email or in-app summary of campaign performance
5. **Assisted posting workflow** — copy + reminders to help users actually post their content

**Self-learning v2 (later):**
- Metricool / platform API integrations for auto-pulling metrics
- AI-assisted content editing with prompts (edit via natural language instruction)
- Deeper pattern analysis with pgvector embeddings

### Short Term
- [ ] Meta Ad Library API integration — pull winning ads as reference for ad generation (filter by longevity as proxy for success)
- [ ] Weekly performance summary / digest — scheduled email or in-app summary of campaign performance
- [ ] Assisted posting workflow — copy + reminders to help users actually post their content
- [ ] pgvector embeddings for semantic content similarity
- [ ] Weekly digest emails (via Resend)
- [ ] Schedule page: month view option

### Medium Term
- [ ] Usage limits by role (free: X products/generations, paid: unlimited)
- [ ] Stripe integration — billing, subscription plans, webhook handler, customer portal

### Infrastructure (When Ready to Go Live)
- [x] Email integration (Resend) — waitlist confirmation, account activation, branded Supabase auth templates
- [x] Supabase Custom SMTP — configure Resend SMTP in Supabase dashboard for branded auth emails (reset password, confirm signup, etc.)
- [x] Custom domain + Vercel deployment — production domains, env vars, auth callback URLs
- [ ] Stripe integration — billing, subscription plans, webhook handler, customer portal

### Admin Features (Future)
- [ ] Generation log — table of recent brain/content generations (user, product, timestamp, token count)
- [ ] User detail view — click user to see their products, generation count, role management, impersonate
- [ ] Billing overview — subscription status, MRR, churn (after Stripe integration)
- [ ] Email log — delivery status via Resend API
- [ ] Feature flags per user — beta-test new modules with specific users
- [ ] Error log — failed API calls, failed email sends

### Polish / UX
- [ ] Website kit: structured editing (edit headline, benefits individually instead of raw text)
- [ ] Onboarding flow for new users (guided product creation)
- [ ] Mobile responsive improvements
- [ ] Schedule page: drag-and-drop scheduling (dnd-kit)

---

## Product Vision: Easy Micro SaaS

### The Big Picture

The marketing engine (current product) becomes one module in a larger platform that guides builders through the full micro-SaaS lifecycle. Most indie hackers jump straight to building and skip the steps that determine whether anyone will care. This product catches them earlier.

**Domain:** easymicrosaas.com
**Journey:** Ideate → Validate → Build → Market

The "product brief" entity is the throughline — created in Ideate, stress-tested in Validate, guided through Build, and activated in Market. Same record, evolving through stages.

### Module 1: Ideate

**Purpose:** Help users find ideas rooted in real demand, not guesswork.

**Mechanism:** Demand signals + guided framework (both combined).

- **Demand signals layer:** Surface what people are actually asking for — Reddit pain points, Google Trends, app store gaps, forum complaints, keyword demand. The AI aggregates and clusters these into opportunity themes.
- **Guided framework layer:** Once a user picks a theme (or brings their own), structured prompts help them shape it into a concrete product concept — target user, core problem, proposed solution, differentiation.
- **Output:** A product brief ready for validation. This becomes the same "product" entity that flows through the rest of the platform.

**Key questions to resolve:**
- Which data sources are feasible and cost-effective? (Reddit API, Google Trends scraping, app store APIs)
- How do we keep demand data fresh enough to be useful?
- How opinionated should the framework be? (Lean Canvas style vs. simpler)

### Module 2: Validate

**Purpose:** Give users evidence-based confidence to build or kill an idea before investing weeks of development.

**Mechanism:** Composite approach — no single validation method works for everyone at this stage, so combine what's available.

**Core components:**

1. **Scorecard (always available)** — Rate the idea across measurable dimensions: demand signals (search volume, community mentions), competition density, technical feasibility, monetisation clarity, market timing. This gives structure even when other data is thin. The score improves as the user completes more validation steps.

2. **AI market research** — Competitor landscape, existing solutions, pricing analysis, gap identification. Caveat: AI knowledge has a cutoff, so this works best paired with live data (from the Ideate module's demand signals). Frame it as "here's what we found" not "here's the definitive answer."

3. **Community testing guidance** — The user likely doesn't have an audience yet, so this is about *where and how* to test, not assuming they already can. Generate tailored test posts for relevant communities (Reddit, Indie Hackers, X), suggest which subreddits/communities match their audience, provide templates for gauging interest without building anything.

4. **Landing page test (later addition)** — Once the Market module exists, this becomes powerful: auto-generate a landing page from the brief, use the marketing engine to drive initial traffic, measure signup intent. This is a natural cross-module feature but requires the Market module to be mature first.

**Output:** A validation report with a composite score, research findings, and a go/no-go recommendation. The product brief gets enriched with validation data that feeds into better marketing output later.

**Key questions to resolve:**
- What score threshold = "validated"? Or is it a spectrum?
- How do we avoid false confidence from AI-only research?
- Should we integrate with any external validation tools?

### Module 3: Build (Assist)

**Purpose:** Guide the user through building their micro-SaaS — not build it for them.

**Mechanism:** Opinionated guidance based on what works for micro-SaaS specifically.

**Possible components:**
- Tech stack recommendations based on the product type (marketplace, tool, API, content platform)
- Project structure templates / boilerplate generation
- Milestone planning (MVP scope, what to cut, what to ship first)
- Integration guidance (payments, auth, hosting — the decisions every builder faces)
- "Ship checklist" — pre-launch readiness checklist

**Key questions to resolve:**
- How deep does Build go? Recommendations only, or actual code/template generation?
- Does this module generate anything, or is it purely advisory?
- Risk of scope creep — this could become an entire product itself

**Note:** This is the module users do themselves. We assist with decisions and structure, not execution. Keep it lightweight.

### Module 4: Market (Current Product)

**Purpose:** Turn the product brief into a structured go-to-market engine.

This is the current marketing module — avatars, campaigns, content generation, scheduling, tracking, analytics. It's the most mature module and the one being built now.

**Future enhancements from other modules:**
- Ideate's demand signals inform better avatar generation
- Validate's research enriches campaign angles (proven pain points, competitor gaps)
- Build's product details enable more accurate content (features, pricing, positioning)

### Navigation & UX Architecture

**Entry flow:** Linear with shortcuts.
- Default path: Ideate → Validate → Build → Market
- Experienced users can jump directly to any module (e.g. "I already have a product" → skip to Market)
- The product brief captures where the user entered, so each module adapts to available context

**App structure:**
- Top-level module switcher (above or replacing current sidebar)
- Each module has its own sidebar nav (current sidebar becomes Market's nav)
- Dashboard becomes a cross-module overview showing all products and their current stage
- Product cards show which stage they're in (ideation / validating / building / marketing)

**Product entity evolution:**
- A product starts as a "seed" in Ideate (just a theme + rough description)
- Validate enriches it with research data and a score
- Build adds technical details and milestones
- Market adds the current fields (channels, avatars, campaigns, content)
- Fields are progressively revealed — Market doesn't show empty Build fields if the user skipped that stage

### Technical Architecture Considerations

**What stays the same:**
- Monorepo structure (pnpm + Turborepo)
- Supabase (Postgres + Auth)
- Next.js App Router
- Current schema for Market module tables

**What changes:**
- `products` table gains a `stage` column (ideation / validation / building / marketing)
- New tables per module (e.g. `validation_reports`, `demand_signals`, `build_milestones`)
- Route structure: `/ideate/...`, `/validate/...`, `/build/...`, `/market/...` (current routes move under `/market`)
- Shared product header/switcher component across all modules
- Module-level feature flags (enable/disable modules per user tier)

**Migration path:**
- Current users (Market-only) are unaffected — their products default to `stage = 'marketing'`
- New modules are additive, not breaking
- Each module can be developed and shipped independently

### Phasing

| Phase | Focus | Status |
|---|---|---|
| **Phase 1** | Market module (current) | In progress |
| **Phase 2** | Module shell + navigation architecture | Not started |
| **Phase 3** | Ideate module | Not started |
| **Phase 4** | Validate module | Not started |
| **Phase 5** | Build module (assist) | Not started |
| **Phase 6** | Cross-module intelligence (validate data improves marketing, etc.) | Not started |

**Current priority:** Finish Phase 1 (marketing module) before starting Phase 2.

---

## Key Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-02-10 | Project name: Easy Micro SaaS (originally Micro Machine) | Rebranded to reflect full platform vision |
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
| 2026-02-10 | Status management available to all users | Changing content status (draft/approved/scheduled/posted) is not admin-only |
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
| 2026-02-13 | UTM params removed from tracked link redirects | Internal click tracking captures full attribution server-side; UTM params cluttered the URL for end users and are redundant |
| 2026-02-13 | Dynamic filter counts on tab badges | Tab counts (Social/Email/Ads/Website) update based on active filters instead of showing static totals |
| 2026-02-13 | Internal files gitignored | EMS_PLAN.md, SQL migrations, .claude/ removed from repo for public-readiness |
| 2026-02-13 | Grouped channel selection in intake | 12 channels organized into Social Media, Communities, Content & Outreach — 3-column grid with section headers |
| 2026-02-13 | Multi-format ad content generation | Ad campaigns produce full creative package (copy + image + video) based on content_formats preference; Google stays text-only |
| 2026-02-13 | Ad prompt engineering with frameworks | Brain and content prompts use PAS, AIDA, BAB frameworks with platform-specific guidance for higher-quality ad output |
| 2026-02-13 | Meta Ad Library API deferred to short-term | Free API exists; can filter for long-running ads (proxy for success); better as a dedicated feature after launch |
| 2026-02-13 | Instagram maps to image-prompt/video-script | Instagram is visual-first; standalone captions don't make sense; channel-aware format instructions guide visual content |
| 2026-02-13 | Marketing site aligned to SITE Framework | Problem-led hero, value exchange (not feature list), GlowCards for depth, unified "Get Early Access" CTAs |
| 2026-02-13 | Outfit + DM Sans fonts across both apps | Consistent brand typography; Outfit for headings (confident), DM Sans for body (clean, readable) |
| 2026-02-13 | Indigo/violet accent system | `#818cf8 → #a78bfa` gradient replaces blue/cyan; consistent across logo, favicon, focus states, charts, links |
| 2026-02-13 | Dashboard card surfaces: white alpha | `white/[0.02]` bg + `white/[0.06]` borders instead of zinc-800/zinc-900 — more depth, consistent with marketing site |
| 2026-02-13 | Waitlist gate via profile.status column | Separates access gating (waitlist/active) from subscription tier (free/paid/admin); avoids overloading the role field |
| 2026-02-13 | Sign-up creates account but gates access | Users get a real Supabase auth account + waitlist entry; admin flips status to `active` when ready to grant access |
| 2026-02-16 | posted_at separate from status workflow | "Published" is internal readiness (draft/ready/published); "posted" means content is live on the platform — orthogonal concerns |
| 2026-02-16 | Posted filter as dropdown, not tab | Posted/unposted cuts across all categories; keeps category tabs for content type filtering |
| 2026-02-16 | Weekly calendar only (no month view) | Social content planning is week-by-week; 7-day view fits desktop well; month view would make cards too small |
| 2026-02-16 | No drag-and-drop for v1 calendar | Click-to-schedule with native date picker covers 90% of use cases; dnd-kit deferred to polish phase |
| 2026-02-16 | Unscheduled pool limited to 50 pieces | Prevents overwhelming UI; encourages scheduling or archiving old content |
| 2026-02-16 | No new dependencies for calendar | Native Date API + HTML5 date input sufficient; date-fns deferred unless timezone support needed |
| 2026-02-16 | Posted content dimmed to 60% opacity | Visual de-emphasis signals "done"; keeps focus on unposted content as work queue |
| 2026-02-16 | Unified content lifecycle replaces fragmented system | Single LifecycleAction component replaces StatusSelect + PostedToggle + native date picker — clearer UX |
| 2026-02-16 | Draft → Approved → Scheduled → Posted | Linear by default but with shortcuts (scheduling a draft auto-approves) — never blocks user with mandatory intermediate steps |
| 2026-02-16 | Custom DatePicker replaces native date input | Native `<input type="date">` looks off-brand on dark theme; custom calendar matches design system with zero new dependencies |
| 2026-02-16 | Status constraint migration with data migration | Migration 00011 safely converts old statuses (`ready`→`approved`, `published`→`approved`, infers `posted`/`scheduled` from timestamps) |
| 2026-02-17 | Product vision: Easy Micro SaaS | Full lifecycle platform — Ideate → Validate → Build → Market. Domain: easymicrosaas.com. Marketing module is Phase 1, other modules are additive |
| 2026-02-17 | Ideate = demand signals + guided framework | Both combined: surface real demand from Reddit/Trends/forums, then guide user to shape it into a product concept |
| 2026-02-17 | Validate = composite approach | Scorecard (always available) + AI research + community testing guidance. Landing page test deferred until Market module is mature |
| 2026-02-17 | Build = assist, not execute | Guidance on tech stack, milestones, ship checklist. Users build it themselves; we help with decisions |
| 2026-02-17 | Linear with shortcuts navigation | Default Ideate→Validate→Build→Market flow, but users can jump directly to any module |
| 2026-02-17 | scheduled_for DATE → TIMESTAMPTZ | Day-level scheduling upgraded to time-level; 30-min slots with 9:00 AM default; existing dates migrated to 09:00 UTC |
| 2026-02-17 | DatePicker with time slot grid | Calendar + scrollable time grid in one popover; confirm button emits ISO timestamp; no external dependencies |
| 2026-02-17 | Rebrand to Easy Micro SaaS | Domain easymicrosaas.com; all text, logos, metadata updated across both apps |
| 2026-02-17 | Rocket + sparkle favicon | Conceptual icon (launch + magic) instead of text monogram; indigo/violet palette; works at all sizes |
| 2026-02-17 | Dark dropdown styling standardised | `bg-zinc-900 [&>option]:bg-zinc-900` applied to all `<select>` elements across 4 dashboard pages |
| 2026-02-17 | Middleware skip for server actions | `next-action` header check prevents middleware from redirecting POST requests for server actions (fixed waitlist insert) |
| 2026-02-17 | Supabase lint fixes (migrations 00012-00014) | Fixed mutable search_path, duplicate indexes, and RLS auth.uid() per-row re-evaluation |
| 2026-02-19 | Generate content available to all users | Admin-only gating on generate/regenerate buttons removed; all authenticated active users can generate brain + content; delete and archive remain admin-only |
| 2026-02-19 | Calendar cards → slide-over panel | Inline expansion made columns too long with multiple posts; compact cards now open a slide-over panel for full content view |
| 2026-02-19 | Bulk status changes on content page | Checkbox per card + sticky bottom toolbar with contextual Approve/Schedule/Mark Posted actions; smart targeting skips pieces already in target status |
| 2026-02-19 | Resend for transactional email | Resend chosen over Postmark for simpler integration, React email templates, generous free tier |
| 2026-02-20 | Hosted img tag for email logos | Inline SVGs don't render in Gmail/Outlook; `<img src="easymicrosaas.com/favicon.svg">` used instead |
| 2026-02-20 | Fire-and-forget email sending | Waitlist confirmation emails don't block the response; failures logged but don't affect user flow |
| 2026-02-20 | Duplicate signup detection before email | Check for existing waitlist entry before sending confirmation; prevents re-sending on duplicate signups |
| 2026-02-20 | Supabase email templates in repo | 6 branded HTML templates stored in `supabase/templates/` for copy-paste into Supabase dashboard; version controlled alongside code |
| 2026-02-20 | Avatars read from DB, not raw_output | Brain page switched from frozen `generation.raw_output` to live `avatars` table; edits automatically flow to content generation; raw_output stays as immutable audit trail |
| 2026-02-20 | Old avatars deactivated on regeneration | `is_active = false` set on existing avatars before inserting new ones; prevents stale + new duplicates without deleting history |
| 2026-02-20 | Avatar-campaign link via FK, not angle matching | `getAvatarName` uses `avatar_id` foreign key instead of matching campaign angle against raw_output — reliable after avatar edits or regeneration |
| 2026-02-20 | Slide-over panel for avatar editing | Same UX pattern as CampaignPanel; inline editing would be too cramped in 3-column grid especially for arrays (pain points) and multi-select (channels) |
| 2026-02-20 | Admin section in sidebar | Separator + "ADMIN" label + sub-links replaces single flat "Users" link; Settings pinned to bottom of sidebar for all users |
| 2026-02-20 | Admin split: system overview + users | `/admin` = platform stats (server component), `/admin/users` = user management (client component); separation of concerns |
| 2026-02-20 | Invite users via Supabase admin API | `auth.admin.inviteUserByEmail()` sends branded invite template; invited users set to `status: 'invited'` (pending until setup) |
| 2026-02-20 | Lazy Resend initialization | `getResend()` singleton replaces top-level `new Resend()`; prevents build-time errors when server components import modules that transitively import Resend |
| 2026-02-20 | Admin user list merges three data sources | Auth users (emails), profiles (role/status), waitlist (name/source) combined via service client; single server action returns complete picture |
| 2026-02-20 | Email logo SVG → PNG | SVGs don't render in Gmail/Outlook; 80x80 PNG generated via sharp, hosted at `easymicrosaas.com/logo.png`; all 8 templates updated |
| 2026-02-20 | Settings page at /settings route | Dedicated page for account management; three independent sections (profile, email, password); available to all authenticated users |
| 2026-02-20 | Password change requires current password | Server action verifies current password via `signInWithPassword` before allowing update; prevents session-only password changes |
| 2026-02-20 | Email change via browser client | `supabase.auth.updateUser({ email })` called client-side so confirmation email redirect works correctly; server-side SSR client can have unreliable redirectTo |
| 2026-02-20 | Initials avatar for v1 | No file upload infrastructure needed; `avatar_url` column exists for future Supabase Storage upload |
| 2026-02-25 | Invite flow → /setup page | Invited users redirected to `/setup` to set name + password instead of landing on dashboard without credentials; uses `supabase.auth.updateUser({ password })` (no current password needed with active session) |
| 2026-02-25 | Invite email hides raw Supabase URL | Fallback link text changed from raw `{{ .ConfirmationURL }}` to "click here to accept your invitation" — URL stays in href only |
| 2026-02-27 | Pending invites tracking | Three-state status (`waitlist → invited → active`) instead of skipping straight to `active`; admins can see who hasn't accepted yet; `activateInvitedUser()` called on `/setup` completion for auto-activation |
