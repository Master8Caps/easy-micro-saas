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
  content_formats: string[];
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
      content_formats: input.content_formats,
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

  // Cascade archived flag to campaigns and content pieces
  const archived = status === "archived";

  await supabase
    .from("campaigns")
    .update({ archived })
    .eq("product_id", productId);

  await supabase
    .from("content_pieces")
    .update({ archived })
    .eq("product_id", productId);

  return { success: true };
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Admin check — only admins can delete products
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admins can delete products" };
  }

  // Delete the product — ON DELETE CASCADE handles campaigns, avatars,
  // generations, content_pieces, links, and clicks automatically
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
