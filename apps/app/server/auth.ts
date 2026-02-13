import "server-only";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getUserWithRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: "free" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  return {
    user,
    role: (profile?.role ?? "free") as "admin" | "paid" | "free",
    status: (profile?.status ?? "waitlist") as "waitlist" | "active",
  };
}
