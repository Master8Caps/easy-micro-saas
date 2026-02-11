"use server";

import { createClient } from "@/lib/supabase/server";

interface LoadBrainInput {
  productId: string;
}

export async function loadBrain(input: LoadBrainInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch product with new fields
  const { data: product } = await supabase
    .from("products")
    .select("name, status, has_website, wants_ads")
    .eq("id", input.productId)
    .single();

  // Find the most recent completed generation for this product
  const { data: generation } = await supabase
    .from("generations")
    .select("id, raw_output")
    .eq("product_id", input.productId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch social campaigns
  const { data: socialCampaigns } = await supabase
    .from("campaigns")
    .select("id, avatar_id, angle, channel, hook, content_type, status, category")
    .eq("product_id", input.productId)
    .eq("category", "social")
    .order("created_at", { ascending: false });

  // Fetch ad campaigns
  const { data: adCampaigns } = await supabase
    .from("campaigns")
    .select("id, avatar_id, angle, channel, hook, content_type, status, category")
    .eq("product_id", input.productId)
    .eq("category", "ad")
    .order("created_at", { ascending: false });

  // Fetch existing content pieces grouped by campaign
  const { data: contentPieces } = await supabase
    .from("content_pieces")
    .select("id, campaign_id")
    .eq("product_id", input.productId)
    .not("campaign_id", "is", null);

  const contentCountMap: Record<string, number> = {};
  contentPieces?.forEach((piece) => {
    if (piece.campaign_id) {
      contentCountMap[piece.campaign_id] = (contentCountMap[piece.campaign_id] ?? 0) + 1;
    }
  });

  // Fetch website kit pieces (no campaign_id)
  const { data: websiteKitPieces } = await supabase
    .from("content_pieces")
    .select("id, type, title, body, metadata, status, created_at")
    .eq("product_id", input.productId)
    .is("campaign_id", null)
    .in("type", ["landing-page-copy", "email-sequence", "meta-description", "tagline"])
    .order("created_at", { ascending: true });

  if (!generation || !generation.raw_output) {
    return {
      output: null,
      socialCampaigns: socialCampaigns ?? [],
      adCampaigns: adCampaigns ?? [],
      contentCounts: contentCountMap,
      websiteKitPieces: websiteKitPieces ?? [],
      productName: product?.name ?? "",
      productStatus: product?.status ?? "active",
      hasWebsite: product?.has_website ?? false,
      wantsAds: product?.wants_ads ?? false,
    };
  }

  return {
    output: generation.raw_output,
    socialCampaigns: socialCampaigns ?? [],
    adCampaigns: adCampaigns ?? [],
    contentCounts: contentCountMap,
    websiteKitPieces: websiteKitPieces ?? [],
    productName: product?.name ?? "",
    productStatus: product?.status ?? "active",
    hasWebsite: product?.has_website ?? false,
    wantsAds: product?.wants_ads ?? false,
  };
}
