import { createClient } from "@/lib/supabase/server";
import { OptimizeDashboard } from "./optimize-dashboard";

export default async function OptimizePage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .order("name");

  const { data: recommendations } = await supabase
    .from("optimization_recommendations")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: activeCampaigns } = await supabase
    .from("ad_campaigns")
    .select("id, name, platform, product_id, daily_budget, status")
    .eq("status", "active");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold">Optimize</h1>
      <p className="mt-1 text-sm text-content-muted">
        AI-powered recommendations to improve your ad performance
      </p>
      <OptimizeDashboard
        products={products ?? []}
        recommendations={recommendations ?? []}
        activeCampaigns={activeCampaigns ?? []}
      />
    </div>
  );
}
