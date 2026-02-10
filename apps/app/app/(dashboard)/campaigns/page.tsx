import { createClient } from "@/lib/supabase/server";
import { CampaignList } from "./campaign-list";

export default async function CampaignsPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      "id, product_id, angle, channel, hook, content_type, status, category, created_at, products(name), avatars(name)",
    )
    .order("created_at", { ascending: false });

  // Count content pieces per campaign
  const { data: contentPieces } = await supabase
    .from("content_pieces")
    .select("campaign_id")
    .not("campaign_id", "is", null);

  const countMap: Record<string, number> = {};
  contentPieces?.forEach((row) => {
    if (row.campaign_id) {
      countMap[row.campaign_id] = (countMap[row.campaign_id] ?? 0) + 1;
    }
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="mt-1 text-zinc-400">
          All campaign angles across your products.
        </p>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <CampaignList
          campaigns={campaigns as any}
          contentCounts={countMap}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-700 p-12 text-center">
          <h2 className="text-lg font-semibold">No campaigns yet</h2>
          <p className="mt-2 text-zinc-400">
            Create a product and generate its Marketing Brain to see campaigns
            here.
          </p>
        </div>
      )}
    </>
  );
}
