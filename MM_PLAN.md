# Micro Machine — Project Plan

## Project Overview

Micro Machine is an internal-first SaaS product that turns a simple product brief into a structured early-growth engine. It helps find the right avatars, test positioning, and acquire the first 100 users for micro-SaaS products.

**Primary audience (initial):** Internal micro-SaaS products built by the team.
**Future audience:** Solo founders, indie hackers, early-stage SaaS teams.

### What It Does

1. Collects a short product/market/goals brief
2. Identifies and refines target avatars
3. Generates campaign angles (organic + paid) per avatar
4. Suggests landing page copy, structure, and design direction
5. Produces channel-specific content and prompts
6. Tracks clicks and early engagement signals via redirect links
7. Identifies winning hooks/angles/avatars and regenerates based on performance

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
| Primary LLM | Anthropic (Claude) |
| Embeddings | OpenAI |
| Hosting | Vercel (two deployments) |
| Email | Resend or Postmark |

---

## Task Tracker

### Completed

- [x] Monorepo scaffolding (pnpm workspaces + Turborepo)
- [x] Root config: package.json, turbo.json, .gitignore, .npmrc, prettier
- [x] Shared packages: `@repo/config` (ESLint, Prettier, TSConfig base)
- [x] Shared packages: `@repo/ui` (Tailwind preset, Button component)
- [x] Shared packages: `@repo/types` (Product, Avatar, Campaign types)
- [x] Marketing site: Next.js app with 7-section conversion page
- [x] Marketing site: Space Grotesk + Inter font setup via next/font
- [x] Marketing site: Dark-mode-first styling
- [x] App shell: Dashboard placeholder with sidebar nav
- [x] App shell: Login page placeholder
- [x] App shell: POST /api/generate/brain (mocked Marketing Brain response)
- [x] App shell: GET /r/[slug] redirect endpoint with console logging
- [x] App shell: /lib (client-safe) and /server (server-only) separation
- [x] App shell: server-only enforcement via `server-only` package
- [x] Environment: .env.example files for both apps with documented keys
- [x] Environment: .gitignore blocks all .env files
- [x] Docs: ENVIRONMENT.md with variable reference and security rules
- [x] Docs: README with monorepo layout, Vercel config, and local dev instructions
- [x] Validation: All packages pass typecheck (0 errors)
- [x] Validation: Both apps build successfully
- [x] Rename: "Marketing Machine" → "Micro Machine"
- [x] Git: Initial commit pushed to GitHub
- [x] Vercel deployment setup (two projects created — env vars still to be configured)

### In Progress

- [ ] Marketing site prototype (v1 — working proof of concept)
- [ ] Domain selection and DNS configuration

### To Do (Before Launch)

- [ ] Add environment variables to both Vercel projects (see .env.example files)
  - Marketing: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL, SUPABASE_URL, SUPABASE_ANON_KEY
  - App: All marketing vars + SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

### Backlog — Stage 1: Core Foundation (Weeks 1–2)

- [ ] Supabase project setup (database, auth, storage)
- [ ] Database schema design (products, avatars, campaigns, content, clicks)
- [ ] Supabase Auth integration (signup, login, session management)
- [ ] Protected routes / auth middleware
- [ ] Product intake flow (brief form)
- [ ] Marketing Brain generation (Anthropic API integration)
- [ ] Structured JSON output for avatars, campaigns, hooks
- [ ] Stripe integration (billing, subscription plans)
- [ ] Event tracking and logging foundation

### Backlog — Stage 2: Content Engine (Weeks 3–4)

- [ ] Idea over-generation per avatar/campaign
- [ ] Idea scoring and ranking
- [ ] Draft generation (text-first: LinkedIn posts, X threads)
- [ ] Prompt-only generation for manual content (video scripts, image prompts)
- [ ] Channel-specific formatting rules
- [ ] Metadata tagging (avatar, hook, angle, CTA type)
- [ ] Content calendar view

### Backlog — Stage 3: Distribution Layer (Weeks 3–4)

- [ ] Assisted posting workflow (copy + reminders)
- [ ] Link generation with automatic UTMs
- [ ] Redirect endpoint connected to database (replace mock)
- [ ] Basic content calendar UI

### Backlog — Stage 4: Learning Loop (Weeks 5–6)

- [ ] Click tracking via redirect service (database insert)
- [ ] Click analytics dashboard
- [ ] Performance scoring model (by avatar, angle, channel)
- [ ] Weekly performance summary
- [ ] Regeneration logic based on top-performing content

### Backlog — Stage 5: Polish

- [ ] Weekly digest emails
- [ ] Simplified dashboard views
- [ ] "Next week's plan" output
- [ ] Clear success indicators and progress metrics

---

## Plan of Action

### Phase 1 — Foundation (Now → Week 2)

**Goal:** Working app with auth, database, product intake, and Marketing Brain generation.

1. **Vercel deployment** — Set up both projects, configure root directories, add environment variables
2. **Supabase setup** — Create project, design initial schema, enable Auth
3. **Auth flow** — Replace login placeholder with Supabase Auth (email + password)
4. **Protected routes** — Middleware to redirect unauthenticated users to /login
5. **Product intake** — Multi-step form: product name, description, market, goals, channels
6. **Marketing Brain** — Connect to Anthropic API, replace mocked endpoint with real generation
7. **Store results** — Save generated avatars, campaigns, and content to Supabase
8. **Stripe setup** — Products, prices, checkout flow, webhook handler

### Phase 2 — Content Engine (Weeks 3–4)

**Goal:** Generate and manage campaign-specific content from Marketing Brain output.

1. **Content generation** — Per-avatar, per-channel content drafts
2. **Content types** — LinkedIn posts, X threads, video hooks/scripts (prompt-based)
3. **Content calendar** — Weekly view of what to post and where
4. **Assisted workflow** — Copy-to-clipboard, "mark as posted" tracking
5. **Link generation** — Auto-generate tracked links with UTMs per content piece

### Phase 3 — Tracking + Learning (Weeks 5–6)

**Goal:** Close the feedback loop. Know what works, improve next output.

1. **Click tracking** — Redirect endpoint writes to database instead of console
2. **Analytics dashboard** — Clicks by campaign, avatar, channel, time
3. **Performance scoring** — Rank hooks, angles, and avatars by engagement
4. **Regeneration** — Feed winning patterns back into content generation
5. **Weekly summary** — Automated performance digest

---

## Week 1 Prototype Requirements

The Week 1 prototype is an **intelligence and output spike** — it validates thinking, messaging quality, and campaign direction. It is not the full MVP.

### Purpose

- Validate avatar discovery and positioning quality
- Assess campaign idea and content output quality
- Enable manual execution and testing of generated content
- Build confidence in the system before building automation

### Included in Prototype

1. **Product intake form**
   - Product name, one-line description
   - Target market / problem being solved
   - Current channels (if any)
   - Goals (first 50 users, validate positioning, etc.)

2. **Avatar discovery and refinement**
   - Generate 2–3 target avatars from the brief
   - Each avatar includes: name, description, pain points, preferred channels
   - Ability to regenerate or refine avatars

3. **Campaign angles per avatar**
   - 2–3 campaign angles per avatar (organic + paid)
   - Each angle includes: hook, channel, content type, why it works

4. **Example content outputs**
   - 1–2 LinkedIn posts per campaign angle
   - 1–2 X/Twitter posts or thread starters
   - Video hook ideas and script prompts (for manual creation)

5. **Landing page suggestions**
   - Headline and subheadline copy
   - Section structure recommendations
   - Image/visual direction prompts

### Explicitly NOT in Prototype

- No posting, scheduling, or automation
- No link tracking or analytics
- No learning or optimisation loops
- No auth, billing, or multi-user concerns
- No database persistence (results shown in-session only)

### Success Criteria

- Brief → avatars → campaigns → content takes under 2 minutes
- Output quality is good enough to post without heavy editing
- Campaign angles feel specific and actionable, not generic
- Internal team would actually use the output to market a product

---

## Key Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-02-10 | Project name: Micro Machine | Working name locked |
| 2026-02-10 | Monorepo with pnpm + Turborepo | Single repo, two Vercel deployments, shared packages |
| 2026-02-10 | Next.js 15 App Router for both apps | Unified stack, server components, API routes |
| 2026-02-10 | Tailwind dark-mode-first | Matches product aesthetic, simpler than toggle |
| 2026-02-10 | Space Grotesk + Inter fonts | Confident headings, clean body text |
| 2026-02-10 | server-only package for backend boundary | Build-time enforcement of client/server separation |
| 2026-02-10 | Supabase for DB + Auth (deferred) | Postgres + pgvector + Auth + Storage in one service |
| 2026-02-10 | Anthropic as primary LLM, OpenAI for embeddings | Best generation quality + best embedding ecosystem |
