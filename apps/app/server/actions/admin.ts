"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendActivationEmail } from "./email";
import { revalidatePath } from "next/cache";

// ── Activate a waitlisted user ───────────────────────
export async function activateUser(userId: string) {
  // Verify calling user is admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admins can activate users" };
  }

  // Use service client to update the target user's profile
  const service = createServiceClient();

  const { error: updateError } = await service
    .from("profiles")
    .update({ status: "active" })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  // Look up the user's email from auth
  const { data: authUser, error: authError } = await service.auth.admin.getUserById(userId);

  if (authError || !authUser?.user?.email) {
    // Profile updated but email failed — still a partial success
    return { success: true, emailSent: false };
  }

  // Send activation email
  await sendActivationEmail(authUser.user.email);

  revalidatePath("/");
  revalidatePath("/admin");

  return { success: true, emailSent: true };
}

// ── Load all users for admin dashboard ──────────────
export async function loadAdminUsers() {
  // Verify calling user is admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admins can view users" };
  }

  const service = createServiceClient();

  // Fetch all profiles
  const { data: profiles } = await service
    .from("profiles")
    .select("id, role, status, created_at")
    .order("created_at", { ascending: false });

  // Fetch auth users to get emails
  const { data: authData } = await service.auth.admin.listUsers();
  const authUsers = authData?.users ?? [];

  // Build email lookup
  const emailMap = new Map<string, string>();
  for (const au of authUsers) {
    if (au.email) emailMap.set(au.id, au.email);
  }

  // Fetch waitlist entries for name/source info
  const { data: waitlistEntries } = await service
    .from("waitlist")
    .select("email, name, source, created_at")
    .order("created_at", { ascending: false });

  const waitlistMap = new Map<string, { name: string | null; source: string | null }>();
  for (const w of waitlistEntries ?? []) {
    waitlistMap.set(w.email, { name: w.name, source: w.source });
  }

  // Merge into user list
  const users = (profiles ?? []).map((p) => {
    const email = emailMap.get(p.id) ?? "";
    const waitlistInfo = waitlistMap.get(email);
    return {
      id: p.id,
      email,
      role: p.role as string,
      status: p.status as string,
      name: waitlistInfo?.name ?? null,
      source: waitlistInfo?.source ?? null,
      created_at: p.created_at as string,
    };
  });

  return {
    waitlisted: users.filter((u) => u.status === "waitlist"),
    active: users.filter((u) => u.status === "active"),
  };
}
