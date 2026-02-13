import { createClient } from "@/lib/supabase/server";
import { CampaignList } from "./campaign-list";

export default async function CampaignsPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      "id, product_id, angle, channel, hook, content_type, status, category, destination_url, created_at, products(name), avatars(name)",
    )
    .eq("archived", false)
    .order("created_at", { ascending: false });

  // Count content pieces per campaign
  const { data: contentPieces } = await supabase
    .from("content_pieces")
    .select("campaign_id")
    .not("campaign_id", "is", null)
    .eq("archived", false);

  const countMap: Record<string, number> = {};
  contentPieces?.forEach((row) => {
    if (row.campaign_id) {
      countMap[row.campaign_id] = (countMap[row.campaign_id] ?? 0) + 1;
    }
  });

  // Count total clicks per campaign
  const { data: linkRows } = await supabase
    .from("links")
    .select("campaign_id, click_count")
    .not("campaign_id", "is", null);

  const clickMap: Record<string, number> = {};
  linkRows?.forEach((row) => {
    if (row.campaign_id) {
      clickMap[row.campaign_id] = (clickMap[row.campaign_id] ?? 0) + (row.click_count ?? 0);
    }
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="mt-1 text-sm text-zinc-500">
          All campaign angles across your products.
        </p>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <CampaignList
          campaigns={campaigns as any}
          contentCounts={countMap}
          clickCounts={clickMap}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-12 text-center">
          <h2 className="text-lg font-semibold">No campaigns yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Create a product and generate its Marketing Brain to see campaigns
            here.
          </p>
        </div>
      )}
    </>
  );
}
