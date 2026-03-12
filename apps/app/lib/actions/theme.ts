"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateThemePreference(theme: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ theme_preference: theme })
    .eq("id", user.id);
}

export async function getThemePreference(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("theme_preference")
    .eq("id", user.id)
    .single();

  return data?.theme_preference ?? null;
}
