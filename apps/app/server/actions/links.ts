"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";

// ── Slug generation ─────────────────────────────────
const SLUG_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
function generateSlug(): string {
  return nanoid(8)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .padEnd(8, "x")
    .slice(0, 8);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// ── Update campaign destination URL ─────────────────
export async function updateCampaignDestinationUrl(
  campaignId: string,
  destinationUrl: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("campaigns")
    .update({ destination_url: destinationUrl || null })
    .eq("id", campaignId);

  if (error) return { error: error.message };

  revalidatePath("/campaigns");
  revalidatePath("/content");

  return { success: true };
}

// ── Create a tracked link for a content piece ───────
export async function createTrackedLink(input: {
  productId: string;
  campaignId: string;
  contentPieceId: string;
  destinationUrl: string;
  channel: string;
  category: string;
  angle: string;
  contentTitle: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const slug = generateSlug();

  const { data, error } = await supabase
    .from("links")
    .insert({
      product_id: input.productId,
      campaign_id: input.campaignId,
      content_piece_id: input.contentPieceId,
      slug,
      destination_url: input.destinationUrl,
      utm_source: slugify(input.channel),
      utm_medium: input.category || "social",
      utm_campaign: slugify(input.angle),
      utm_content: slugify(input.contentTitle),
    })
    .select("id, slug, destination_url, click_count")
    .single();

  if (error) return { error: error.message };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  return {
    link: {
      ...data,
      tracked_url: `${baseUrl}/r/${data.slug}`,
    },
  };
}

// ── Get links for a campaign ────────────────────────
export async function getLinksForCampaign(campaignId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("links")
    .select("id, slug, content_piece_id, destination_url, click_count, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { links: data ?? [] };
}

// ── Get all links for a product ─────────────────────
export async function getLinksForProduct(productId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("links")
    .select(
      "id, slug, content_piece_id, campaign_id, destination_url, utm_source, click_count, created_at, campaigns(angle, channel), content_pieces(title)",
    )
    .eq("product_id", productId)
    .order("click_count", { ascending: false });

  if (error) return { error: error.message };
  return { links: data ?? [] };
}

// ── Analytics summary ───────────────────────────────
export async function getAnalyticsSummary(productId?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch all links (optionally filtered by product)
  let linksQuery = supabase
    .from("links")
    .select(
      "id, slug, product_id, campaign_id, content_piece_id, destination_url, utm_source, utm_medium, click_count, created_at, campaigns(angle, channel), content_pieces(title), products(name)",
    )
    .order("click_count", { ascending: false });

  if (productId) {
    linksQuery = linksQuery.eq("product_id", productId);
  }

  const { data: links, error: linksError } = await linksQuery;
  if (linksError) return { error: linksError.message };

  const allLinks = links ?? [];

  // Aggregate stats
  const totalClicks = allLinks.reduce((sum, l) => sum + (l.click_count ?? 0), 0);
  const totalLinks = allLinks.length;

  // Clicks by channel
  const byChannel: Record<string, number> = {};
  for (const link of allLinks) {
    const ch = link.utm_source || "unknown";
    byChannel[ch] = (byChannel[ch] ?? 0) + (link.click_count ?? 0);
  }

  // Fetch recent clicks for time-series (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const linkIds = allLinks.map((l) => l.id);

  let clicks7d = 0;
  let clicks30d = 0;
  const dailyClicks: Record<string, number> = {};

  if (linkIds.length > 0) {
    const { data: recentClicks } = await supabase
      .from("clicks")
      .select("clicked_at, link_id")
      .in("link_id", linkIds)
      .gte("clicked_at", thirtyDaysAgo.toISOString())
      .order("clicked_at", { ascending: true });

    for (const click of recentClicks ?? []) {
      const date = click.clicked_at.split("T")[0];
      dailyClicks[date] = (dailyClicks[date] ?? 0) + 1;
      clicks30d++;
      if (new Date(click.clicked_at) >= sevenDaysAgo) {
        clicks7d++;
      }
    }
  }

  // Fetch products for the filter dropdown
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .neq("status", "archived")
    .order("name");

  return {
    summary: {
      totalClicks,
      clicks7d,
      clicks30d,
      totalLinks,
      topLinks: allLinks.slice(0, 10),
      byChannel,
      dailyClicks,
      products: products ?? [],
    },
  };
}
