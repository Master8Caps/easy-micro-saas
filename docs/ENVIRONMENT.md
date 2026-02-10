# Environment Variables

## Where to Set Variables

### Local Development

1. Copy `.env.example` to `.env.local` in each app directory:
   ```bash
   cp apps/marketing/.env.example apps/marketing/.env.local
   cp apps/app/.env.example apps/app/.env.local
   ```
2. Fill in the actual values in `.env.local`
3. Never commit `.env.local` or any `.env` file (enforced by `.gitignore`)

### Vercel (Production / Preview)

1. Go to the Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each variable with the appropriate scope (Production, Preview, Development)
4. Each app has its own Vercel project — set variables per project

## Variable Reference

### Public Variables (`NEXT_PUBLIC_*`)

These are **embedded in the client-side JavaScript bundle** and visible to anyone who inspects the page source.

| Variable                       | Used By        | Description                          |
|--------------------------------|----------------|--------------------------------------|
| `NEXT_PUBLIC_APP_URL`          | Marketing, App | URL of the app (e.g., `https://app.yourdomain.com`) |
| `NEXT_PUBLIC_SITE_URL`         | Marketing, App | URL of the marketing site (e.g., `https://yourdomain.com`) |
| `NEXT_PUBLIC_SUPABASE_URL`     | App            | Supabase project URL (safe to expose) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| App            | Supabase anon key (safe to expose — RLS enforces access control) |

### Server-Only Variables

These are **only accessible in server-side code** (API routes, server components, server actions, middleware). Never prefix these with `NEXT_PUBLIC_`.

| Variable                    | Used By  | Description                              |
|-----------------------------|----------|------------------------------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | App      | Supabase service role key (full access, bypasses RLS) |
| `ANTHROPIC_API_KEY`         | App      | Anthropic API key (content generation)   |
| `OPENAI_API_KEY`            | App      | OpenAI API key (embeddings only)         |
| `STRIPE_SECRET_KEY`         | App      | Stripe secret key (billing)              |
| `STRIPE_WEBHOOK_SECRET`     | App      | Stripe webhook signing secret            |

### Why Supabase URL and Anon Key Are Public

The Supabase URL and anon key are intentionally prefixed with `NEXT_PUBLIC_` because:
- The browser client needs them to communicate with Supabase directly
- The anon key only grants access that Row Level Security (RLS) policies allow
- This is the standard Supabase pattern — the anon key is not a secret
- The **service role key** bypasses RLS and must remain server-only

## Security Rules

1. **Never commit secrets.** All `.env` files are listed in `.gitignore`. If you accidentally commit a secret, rotate it immediately.

2. **Only `SUPABASE_SERVICE_ROLE_KEY` and API keys are true secrets.** The Supabase URL and anon key are designed to be public. Do not prefix actual secrets with `NEXT_PUBLIC_`.

3. **Use the `server-only` package.** All files in `/apps/app/server/` import `server-only` at the top. This causes a build error if any client component tries to import them, preventing accidental secret exposure.

4. **Rotate keys immediately if exposed.** If a secret is ever committed to git or exposed in client code:
   - Regenerate the key in the provider dashboard (Supabase, Stripe, Anthropic, OpenAI)
   - Update the new key in Vercel environment variables
   - Deploy to apply the change
