"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreateAdCampaignInput {
  productId: string;
  platform: string;
  name: string;
  objective: string;
  dailyBudget: number;
  totalBudget: number;
  currency?: string;
  audienceTargeting: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
}

export async function createAdCampaign(input: CreateAdCampaignInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("ad_campaigns")
    .insert({
      user_id: user.id,
      product_id: input.productId,
      platform: input.platform,
      name: input.name,
      objective: input.objective,
      daily_budget: input.dailyBudget,
      total_budget: input.totalBudget,
      currency: input.currency ?? "USD",
      audience_targeting: input.audienceTargeting,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/ads");
  return { id: data.id };
}

export async function updateAdCampaign(
  id: string,
  updates: Partial<{
    name: string;
    objective: string;
    status: string;
    dailyBudget: number;
    totalBudget: number;
    audienceTargeting: Record<string, unknown>;
    startDate: string;
    endDate: string;
  }>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.objective !== undefined) dbUpdates.objective = updates.objective;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.dailyBudget !== undefined)
    dbUpdates.daily_budget = updates.dailyBudget;
  if (updates.totalBudget !== undefined)
    dbUpdates.total_budget = updates.totalBudget;
  if (updates.audienceTargeting !== undefined)
    dbUpdates.audience_targeting = updates.audienceTargeting;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;

  const { error } = await supabase
    .from("ad_campaigns")
    .update(dbUpdates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/ads");
  return { success: true };
}

export async function deleteAdCampaign(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/ads");
  return { success: true };
}

export async function getAdCampaigns(productId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", data: [] };

  let query = supabase
    .from("ad_campaigns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message, data: [] };

  return { data: data ?? [] };
}

export async function getAdCampaign(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("ad_campaigns")
    .select(
      `
      *,
      ad_sets (
        *,
        ads (*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) return { error: error.message };

  return { data };
}
