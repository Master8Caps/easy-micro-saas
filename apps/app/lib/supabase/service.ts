import { createClient } from "@supabase/supabase-js";

/**
 * Service role Supabase client — bypasses RLS.
 * Used for server-side operations like logging clicks (no user session).
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
