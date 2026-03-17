"use server";

import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

export interface HealthAlert {
  type: "warning" | "danger" | "success";
  metric: string;
  message: string;
  campaignId: string;
  campaignName: string;
}

export async function getCampaignHealthAlerts(
  productId: string,
): Promise<{ alerts: HealthAlert[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { alerts: [], error: "Not authenticated" };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select("id, name, status, daily_budget")
    .eq("product_id", productId)
    .eq("status", "active");

  if (!campaigns || campaigns.length === 0) return { alerts: [] };

  const { data: performance } = await supabase
    .from("ad_performance")
    .select("*")
    .eq("product_id", productId)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

  if (!performance || performance.length === 0) return { alerts: [] };

  const alerts: HealthAlert[] = [];

  const byCampaign = new Map<string, typeof performance>();
  for (const row of performance) {
    const existing = byCampaign.get(row.ad_campaign_id) ?? [];
    existing.push(row);
    byCampaign.set(row.ad_campaign_id, existing);
  }

  for (const campaign of campaigns) {
    const rows = byCampaign.get(campaign.id);
    if (!rows || rows.length === 0) continue;

    const totalSpend = rows.reduce((s, r) => s + Number(r.spend), 0);
    const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
    const totalConversions = rows.reduce((s, r) => s + r.conversions, 0);
    const totalConversionValue = rows.reduce(
      (s, r) => s + Number(r.conversion_value),
      0,
    );

    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const roas = totalSpend > 0 ? totalConversionValue / totalSpend : 0;
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    if (ctr < 0.01 && totalImpressions > 500) {
      alerts.push({
        type: "danger",
        metric: "CTR",
        message: `CTR is ${(ctr * 100).toFixed(2)}% — ad isn't grabbing attention. Consider refreshing the creative.`,
        campaignId: campaign.id,
        campaignName: campaign.name,
      });
    } else if (ctr >= 0.03) {
      alerts.push({
        type: "success",
        metric: "CTR",
        message: `CTR is ${(ctr * 100).toFixed(2)}% — strong engagement.`,
        campaignId: campaign.id,
        campaignName: campaign.name,
      });
    }

    if (totalConversions > 0 && roas < 1) {
      alerts.push({
        type: "danger",
        metric: "ROAS",
        message: `ROAS is ${roas.toFixed(2)}x — campaign isn't profitable at current spend.`,
        campaignId: campaign.id,
        campaignName: campaign.name,
      });
    } else if (roas >= 3) {
      alerts.push({
        type: "success",
        metric: "ROAS",
        message: `ROAS is ${roas.toFixed(2)}x — strong return. Consider scaling budget.`,
        campaignId: campaign.id,
        campaignName: campaign.name,
      });
    }

    if (cpc > Number(campaign.daily_budget) * 0.2 && totalClicks > 10) {
      alerts.push({
        type: "warning",
        metric: "CPC",
        message: `CPC is $${cpc.toFixed(2)} — each click costs ${((cpc / Number(campaign.daily_budget)) * 100).toFixed(0)}% of daily budget.`,
        campaignId: campaign.id,
        campaignName: campaign.name,
      });
    }
  }

  return { alerts };
}

export async function analyzeAndRecommend(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select("id, name, platform, objective, daily_budget, status")
    .eq("product_id", productId)
    .in("status", ["active", "paused"]);

  if (!campaigns || campaigns.length < 2) {
    return { error: "Need at least 2 campaigns with data for cross-campaign analysis" };
  }

  const { data: performance } = await supabase
    .from("ad_performance")
    .select("*")
    .eq("product_id", productId)
    .order("date", { ascending: false })
    .limit(200);

  if (!performance || performance.length === 0) {
    return { error: "No performance data available" };
  }

  const campaignSummaries = campaigns.map((c) => {
    const rows = performance.filter((p) => p.ad_campaign_id === c.id);
    const totalSpend = rows.reduce((s, r) => s + Number(r.spend), 0);
    const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
    const totalConversions = rows.reduce((s, r) => s + r.conversions, 0);
    const totalConversionValue = rows.reduce(
      (s, r) => s + Number(r.conversion_value),
      0,
    );
    const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      objective: c.objective,
      dailyBudget: c.daily_budget,
      status: c.status,
      totalSpend,
      totalClicks,
      totalConversions,
      totalConversionValue,
      totalImpressions,
      ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      roas: totalSpend > 0 ? totalConversionValue / totalSpend : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      days: rows.length,
    };
  });

  const prompt = `You are an expert media buyer analyzing ad campaign performance. Based on the data below, provide specific, actionable optimization recommendations.

CAMPAIGNS:
${JSON.stringify(campaignSummaries, null, 2)}

Analyze the data and provide 2-5 recommendations. For each recommendation, specify:
- type: one of "budget_shift", "creative_refresh", "audience_adjust", "pause", "scale"
- summary: one sentence, plain language
- details: structured data with specific numbers and campaign references

Respond in JSON:
{
  "recommendations": [
    {
      "type": "budget_shift",
      "summary": "Shift $X/day from Campaign A to Campaign B — B converts 3x better",
      "details": {
        "fromCampaignId": "...",
        "toCampaignId": "...",
        "amount": 20,
        "reasoning": "..."
      }
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { error: "Failed to parse AI response" };

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      recommendations: Array<{
        type: string;
        summary: string;
        details: Record<string, unknown>;
      }>;
    };

    const inserts = parsed.recommendations.map((rec) => ({
      user_id: user.id,
      product_id: productId,
      type: rec.type,
      summary: rec.summary,
      details: rec.details,
    }));

    const { error } = await supabase
      .from("optimization_recommendations")
      .insert(inserts);

    if (error) return { error: error.message };

    revalidatePath("/ads");
    return { recommendations: parsed.recommendations };
  } catch {
    return { error: "Failed to parse optimization recommendations" };
  }
}

export async function getRecommendations(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", data: [] };

  const { data, error } = await supabase
    .from("optimization_recommendations")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };

  return { data: data ?? [] };
}

export async function updateRecommendation(
  id: string,
  status: "accepted" | "dismissed",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("optimization_recommendations")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/ads");
  return { success: true };
}
