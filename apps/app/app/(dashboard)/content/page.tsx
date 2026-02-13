import { createClient } from "@/lib/supabase/server";
import { ContentList } from "./content-list";

export default async function ContentPage() {
  const supabase = await createClient();

  const { data: pieces } = await supabase
    .from("content_pieces")
    .select(
      "id, product_id, campaign_id, type, title, body, metadata, status, archived, created_at, products(name), campaigns(angle, channel, category), links(id, slug, click_count)",
    )
    .order("created_at", { ascending: false });

  // Get unique products for the filter dropdown
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .order("name");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Content</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Browse and manage generated content pieces.
        </p>
      </div>

      {pieces && pieces.length > 0 ? (
        <ContentList
          pieces={pieces as any}
          products={(products ?? []) as { id: string; name: string }[]}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-12 text-center">
          <h2 className="text-lg font-semibold">No content yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Generate content from your campaign angles on each product&apos;s
            brain page.
          </p>
        </div>
      )}
    </>
  );
}
