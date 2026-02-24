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
  revalidatePath("/admin/users");

  return { success: true, emailSent: true };
}

// ── Invite a user by email ───────────────────────────
export async function inviteUser(email: string) {
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
    return { error: "Only admins can invite users" };
  }

  const service = createServiceClient();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.easymicrosaas.com";

  const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/setup`,
  });

  if (error) return { error: error.message };

  // Set invited user's profile to active (skip waitlist)
  if (data?.user?.id) {
    await service
      .from("profiles")
      .update({ status: "active" })
      .eq("id", data.user.id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");

  return { success: true };
}

// ── Load system stats for admin overview ─────────────
export async function loadSystemStats() {
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
    return { error: "Only admins can view system stats" };
  }

  const service = createServiceClient();

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: waitlistedUsers },
    { count: totalProducts },
    { count: totalGenerations },
    { count: totalContentPieces },
    { count: totalClicks },
  ] = await Promise.all([
    service.from("profiles").select("*", { count: "exact", head: true }),
    service
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    service
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "waitlist"),
    service.from("products").select("*", { count: "exact", head: true }),
    service.from("generations").select("*", { count: "exact", head: true }),
    service.from("content_pieces").select("*", { count: "exact", head: true }),
    service.from("clicks").select("*", { count: "exact", head: true }),
  ]);

  // Generations this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: generationsThisWeek } = await service
    .from("generations")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo.toISOString());

  // Recent signups (last 10)
  const { data: recentProfiles } = await service
    .from("profiles")
    .select("id, role, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: authData } = await service.auth.admin.listUsers();
  const authUsers = authData?.users ?? [];
  const emailMap = new Map<string, string>();
  for (const au of authUsers) {
    if (au.email) emailMap.set(au.id, au.email);
  }

  const { data: waitlistEntries } = await service
    .from("waitlist")
    .select("email, source");
  const sourceMap = new Map<string, string>();
  for (const w of waitlistEntries ?? []) {
    sourceMap.set(w.email, w.source);
  }

  const recentSignups = (recentProfiles ?? []).map((p) => {
    const email = emailMap.get(p.id) ?? "";
    return {
      email,
      role: p.role as string,
      status: p.status as string,
      source: sourceMap.get(email) ?? null,
      created_at: p.created_at as string,
    };
  });

  return {
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
    waitlistedUsers: waitlistedUsers ?? 0,
    totalProducts: totalProducts ?? 0,
    totalGenerations: totalGenerations ?? 0,
    totalContentPieces: totalContentPieces ?? 0,
    totalClicks: totalClicks ?? 0,
    generationsThisWeek: generationsThisWeek ?? 0,
    recentSignups,
  };
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
