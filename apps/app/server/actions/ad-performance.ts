"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PerformanceEntry {
  adCampaignId: string;
  adSetId?: string;
  adId?: string;
  productId: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
}

export async function upsertPerformance(entry: PerformanceEntry) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("ad_performance").upsert(
    {
      ad_campaign_id: entry.adCampaignId,
      ad_set_id: entry.adSetId ?? null,
      ad_id: entry.adId ?? null,
      product_id: entry.productId,
      date: entry.date,
      spend: entry.spend,
      impressions: entry.impressions,
      clicks: entry.clicks,
      conversions: entry.conversions,
      conversion_value: entry.conversionValue,
      source: "manual",
    },
    {
      onConflict: "ad_campaign_id,ad_set_id,ad_id,date",
    },
  );

  if (error) return { error: error.message };

  revalidatePath("/ads");
  return { success: true };
}

export async function getPerformance(
  adCampaignId: string,
  dateRange?: { from: string; to: string },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", data: [] };

  let query = supabase
    .from("ad_performance")
    .select("*")
    .eq("ad_campaign_id", adCampaignId)
    .order("date", { ascending: false });

  if (dateRange) {
    query = query.gte("date", dateRange.from).lte("date", dateRange.to);
  }

  const { data, error } = await query;
  if (error) return { error: error.message, data: [] };

  return { data: data ?? [] };
}

export async function getProductPerformanceSummary(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("ad_performance")
    .select("spend, impressions, clicks, conversions, conversion_value, ctr, roas, date")
    .eq("product_id", productId)
    .order("date", { ascending: false });

  if (error) return { error: error.message };

  if (!data || data.length === 0) {
    return {
      data: {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalConversionValue: 0,
        avgCtr: 0,
        avgRoas: 0,
        entries: [],
      },
    };
  }

  const totalSpend = data.reduce((s, r) => s + Number(r.spend), 0);
  const totalImpressions = data.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = data.reduce((s, r) => s + r.clicks, 0);
  const totalConversions = data.reduce((s, r) => s + r.conversions, 0);
  const totalConversionValue = data.reduce(
    (s, r) => s + Number(r.conversion_value),
    0,
  );

  return {
    data: {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalConversionValue,
      avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      avgRoas: totalSpend > 0 ? totalConversionValue / totalSpend : 0,
      entries: data,
    },
  };
}
