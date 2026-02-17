"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function addToWaitlist(email: string) {
  console.log("[waitlist] Adding to waitlist:", email);
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("waitlist")
      .upsert(
        { email: email.toLowerCase().trim(), source: "app-signup" },
        { onConflict: "email" },
      )
      .select();
    if (error) {
      console.error("[waitlist] Insert failed:", error.message, error.details, error.hint);
    } else {
      console.log("[waitlist] Insert succeeded:", data);
    }
  } catch (err) {
    console.error("[waitlist] Action error:", err);
  }
}
