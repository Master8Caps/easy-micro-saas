"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function addToWaitlist(email: string) {
  const supabase = createServiceClient();
  await supabase
    .from("waitlist")
    .upsert({ email, source: "app-signup" }, { onConflict: "email" });
}
