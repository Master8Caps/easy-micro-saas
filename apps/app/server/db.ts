import "server-only";

// ============================================
// Database client — server-only
// ============================================
// This file will contain Supabase client initialization
// using SUPABASE_SERVICE_ROLE_KEY (never exposed to client).
//
// Usage:
//   import { getServerSupabaseClient } from "@/server/db";
//   const supabase = getServerSupabaseClient();

export function getServerSupabaseClient() {
  // TODO: Initialize Supabase server client
  // import { createClient } from "@supabase/supabase-js";
  // return createClient(
  //   process.env.SUPABASE_URL!,
  //   process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // );
  throw new Error("Database client not configured yet. Set up Supabase first.");
}
