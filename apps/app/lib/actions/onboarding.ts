"use server";

import { createClient } from "@/lib/supabase/server";

type StepKey =
  | "account"
  | "profile"
  | "product"
  | "brain"
  | "campaigns"
  | "schedule";

export async function completeOnboardingStep(stepKey: StepKey) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_onboarding_steps")
    .upsert(
      {
        user_id: user.id,
        step_key: stepKey,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,step_key" }
    );
}

export async function getOnboardingProgress() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single();

  // If onboarding is already dismissed, don't fetch steps
  if (profile?.onboarding_completed_at) return null;

  const { data: steps } = await supabase
    .from("user_onboarding_steps")
    .select("step_key, completed_at")
    .eq("user_id", user.id);

  return {
    completedSteps: (steps || []).map((s) => s.step_key),
    totalSteps: 6,
  };
}

export async function dismissOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
}
