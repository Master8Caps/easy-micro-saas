import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/server/auth";
import { AnalyticsDashboard } from "./analytics-dashboard";

export default async function AnalyticsPage() {
  await requireAuth();
  const supabase = await createClient();

  // Fetch all products for filter dropdown
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .neq("status", "archived")
    .order("name");

  // Fetch all links with related data
  const { data: links } = await supabase
    .from("links")
    .select(
      "id, slug, product_id, campaign_id, content_piece_id, destination_url, utm_source, utm_medium, click_count, created_at, campaigns(angle, channel), content_pieces(title), products(name)",
    )
    .order("click_count", { ascending: false });

  // Fetch recent clicks (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const linkIds = (links ?? []).map((l) => l.id);

  let recentClicks: { clicked_at: string; link_id: string }[] = [];
  if (linkIds.length > 0) {
    const { data } = await supabase
      .from("clicks")
      .select("clicked_at, link_id")
      .in("link_id", linkIds)
      .gte("clicked_at", thirtyDaysAgo.toISOString())
      .order("clicked_at", { ascending: true });
    recentClicks = data ?? [];
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-zinc-400">
          Track clicks, engagement, and performance across campaigns.
        </p>
      </div>

      <AnalyticsDashboard
        products={(products ?? []) as { id: string; name: string }[]}
        links={(links ?? []) as any}
        recentClicks={recentClicks}
      />
    </>
  );
}
