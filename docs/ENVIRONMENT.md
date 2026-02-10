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

| Variable               | Used By        | Description                          |
|------------------------|----------------|--------------------------------------|
| `NEXT_PUBLIC_APP_URL`  | Marketing, App | URL of the app (e.g., `https://app.yourdomain.com`) |
| `NEXT_PUBLIC_SITE_URL` | Marketing, App | URL of the marketing site (e.g., `https://yourdomain.com`) |

### Server-Only Variables

These are **only accessible in server-side code** (API routes, server components, server actions, middleware). Never prefix these with `NEXT_PUBLIC_`.

| Variable                    | Used By  | Description                              |
|-----------------------------|----------|------------------------------------------|
| `SUPABASE_URL`              | App      | Supabase project URL                     |
| `SUPABASE_ANON_KEY`         | App      | Supabase anonymous/public key            |
| `SUPABASE_SERVICE_ROLE_KEY` | App      | Supabase service role key (full access)  |
| `ANTHROPIC_API_KEY`         | App      | Anthropic API key (content generation)   |
| `OPENAI_API_KEY`            | App      | OpenAI API key (embeddings only)         |
| `STRIPE_SECRET_KEY`         | App      | Stripe secret key (billing)              |
| `STRIPE_WEBHOOK_SECRET`     | App      | Stripe webhook signing secret            |

## Security Rules

1. **Never commit secrets.** All `.env` files are listed in `.gitignore`. If you accidentally commit a secret, rotate it immediately.

2. **Never prefix secrets with `NEXT_PUBLIC_`.** The `NEXT_PUBLIC_` prefix tells Next.js to include the variable in the client bundle. Anything with this prefix is publicly visible.

3. **Use the `server-only` package.** All files in `/apps/app/server/` import `server-only` at the top. This causes a build error if any client component tries to import them, preventing accidental secret exposure.

4. **Rotate keys immediately if exposed.** If a secret is ever committed to git or exposed in client code:
   - Regenerate the key in the provider dashboard (Supabase, Stripe, Anthropic, OpenAI)
   - Update the new key in Vercel environment variables
   - Deploy to apply the change
