import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CampaignDetail } from "./campaign-detail";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("ad_campaigns")
    .select(
      `
      *,
      products (name),
      ad_sets (
        *,
        ads (*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  const { data: performance } = await supabase
    .from("ad_performance")
    .select("*")
    .eq("ad_campaign_id", id)
    .order("date", { ascending: false });

  const { data: recommendations } = await supabase
    .from("optimization_recommendations")
    .select("*")
    .eq("product_id", campaign.product_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <CampaignDetail
      campaign={campaign}
      performance={performance ?? []}
      recommendations={recommendations ?? []}
    />
  );
}
