"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { completeOnboardingStep } from "@/lib/actions/onboarding";

export async function updateProfile(fullName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim() || null })
    .eq("id", user.id);

  if (error) return { error: error.message };

  try { await completeOnboardingStep("profile"); } catch {}

  revalidatePath("/settings");
  return { success: true };
}

export async function activateInvitedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only transition from 'invited' to 'active'
  const { error } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", user.id)
    .eq("status", "invited");

  if (error) return { error: error.message };

  try { await completeOnboardingStep("account"); } catch {}

  return { success: true };
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (signInError) return { error: "Current password is incorrect" };

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) return { error: updateError.message };

  return { success: true };
}
