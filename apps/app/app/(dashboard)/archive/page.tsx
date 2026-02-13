import { createClient } from "@/lib/supabase/server";
import { ArchiveList } from "./archive-list";

export default async function ArchivePage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, status, created_at")
    .eq("status", "archived")
    .order("created_at", { ascending: false });

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      "id, product_id, angle, channel, hook, content_type, status, category, created_at, products(name), avatars(name)",
    )
    .eq("archived", true)
    .order("created_at", { ascending: false });

  const { data: contentPieces } = await supabase
    .from("content_pieces")
    .select("id, product_id")
    .eq("archived", true);

  const contentCountByProduct: Record<string, number> = {};
  contentPieces?.forEach((piece) => {
    contentCountByProduct[piece.product_id] =
      (contentCountByProduct[piece.product_id] ?? 0) + 1;
  });

  const campaignCountByProduct: Record<string, number> = {};
  campaigns?.forEach((c) => {
    campaignCountByProduct[c.product_id] =
      (campaignCountByProduct[c.product_id] ?? 0) + 1;
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Archive</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Archived products and their campaigns and content.
        </p>
      </div>

      {products && products.length > 0 ? (
        <ArchiveList
          products={products}
          campaigns={
            ((campaigns ?? []) as unknown as {
              id: string;
              product_id: string;
              angle: string;
              channel: string;
              hook: string;
              content_type: string;
              status: string;
              category: string;
              created_at: string;
              products: { name: string } | null;
              avatars: { name: string } | null;
            }[])
          }
          campaignCounts={campaignCountByProduct}
          contentCounts={contentCountByProduct}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-12 text-center">
          <h2 className="text-lg font-semibold">No archived products</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Products you archive will appear here.
          </p>
        </div>
      )}
    </>
  );
}
