import { createClient } from "@/lib/supabase/server";
import { AdsList } from "./ads-list";

export default async function AdsPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select(
      `
      *,
      products (name),
      ad_sets (
        id,
        ads (id)
      )
    `,
    )
    .order("created_at", { ascending: false });

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .order("name");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Ad Campaigns</h1>
          <p className="mt-1 text-sm text-content-muted">
            Generate, deploy, and optimize your ad campaigns
          </p>
        </div>
      </div>
      <AdsList
        campaigns={campaigns ?? []}
        products={products ?? []}
      />
    </div>
  );
}
