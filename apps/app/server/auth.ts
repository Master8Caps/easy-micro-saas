import "server-only";

// ============================================
// Auth helpers — server-only
// ============================================
// Server-side authentication utilities.
// Uses Supabase Auth for session management.
//
// Usage:
//   import { getSession, requireAuth } from "@/server/auth";

export async function getSession() {
  // TODO: Implement session retrieval from Supabase Auth
  // const supabase = getServerSupabaseClient();
  // const { data: { session } } = await supabase.auth.getSession();
  // return session;
  return null;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
