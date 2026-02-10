"use server";

import { createClient } from "@/lib/supabase/server";

interface CreateProductInput {
  name: string;
  description: string;
  market: string;
  goals: string;
  channels: string[];
  has_website: boolean;
  website_url: string;
  wants_ads: boolean;
  ad_platforms: string[];
}

export async function createProduct(input: CreateProductInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description,
      market: input.market,
      goals: input.goals,
      channels: input.channels,
      has_website: input.has_website,
      website_url: input.website_url || null,
      wants_ads: input.wants_ads,
      ad_platforms: input.ad_platforms,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { id: data.id };
}

export async function updateProductStatus(productId: string, status: "active" | "archived") {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
