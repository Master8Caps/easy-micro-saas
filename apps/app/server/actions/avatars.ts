"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface UpdateAvatarInput {
  avatarId: string;
  name: string;
  description: string;
  pain_points: string[];
  channels: string[];
  icp_details: {
    role: string;
    context: string;
    motivation: string;
  };
}

export async function updateAvatar(input: UpdateAvatarInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("avatars")
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      pain_points: input.pain_points.filter((p) => p.trim() !== ""),
      channels: input.channels,
      icp_details: input.icp_details,
    })
    .eq("id", input.avatarId);

  if (error) return { error: error.message };

  revalidatePath("/products");

  return { success: true };
}
