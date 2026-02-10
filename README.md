# Micro Machine

Monorepo for the marketing site and SaaS application.

## Repository Structure

```
├── apps/
│   ├── marketing/     → Marketing website (Next.js)
│   └── app/           → SaaS application (Next.js)
├── packages/
│   ├── ui/            → Shared UI components and Tailwind preset
│   ├── config/        → Shared ESLint, Prettier, and TypeScript configs
│   └── types/         → Shared TypeScript type definitions
└── docs/              → Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Install

```bash
pnpm install
```

### Run Locally

```bash
# Run both apps in parallel
pnpm dev

# Run only marketing site (port 3000)
pnpm --filter @repo/marketing dev

# Run only app (port 3001)
pnpm --filter @repo/app dev
```

### Other Commands

```bash
pnpm build          # Build all apps and packages
pnpm lint           # Lint all apps and packages
pnpm typecheck      # Type-check all apps and packages
pnpm format         # Format all files with Prettier
pnpm format:check   # Check formatting without writing
```

## Vercel Deployment

This monorepo deploys as **two separate Vercel projects** from the same GitHub repository.

### Marketing Site

- **Root Directory:** `apps/marketing`
- **Framework Preset:** Next.js
- **Domain:** yourdomain.com

### App

- **Root Directory:** `apps/app`
- **Framework Preset:** Next.js
- **Domain:** app.yourdomain.com

### How to Configure

1. Import the same GitHub repo twice in Vercel (create two projects)
2. For each project, set the **Root Directory** in Project Settings → General
3. Vercel automatically detects pnpm workspaces and installs all dependencies
4. Set environment variables per project in Settings → Environment Variables

## Environment Variables

- Each app has a `.env.example` file listing required variables
- Copy to `.env.local` for local development
- See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for full documentation
- **Never commit `.env` files** — they are in `.gitignore`

## Architecture

### Frontend vs Backend Separation (in /apps/app)

```
apps/app/
├── app/          → Next.js App Router (pages, layouts, API routes)
├── components/   → React components (client-safe)
├── lib/          → Client-safe helpers and utilities
└── server/       → Server-only logic (DB, auth, API helpers)
```

- Files in `/lib` can be imported anywhere (client or server)
- Files in `/server` import `server-only` and will throw a build error if imported in client components
- Environment variables without the `NEXT_PUBLIC_` prefix are only available server-side
