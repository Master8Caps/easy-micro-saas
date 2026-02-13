import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/pills";
import { ProductDeleteButton } from "@/components/product-delete-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: activeProducts } = await supabase
    .from("products")
    .select("id, name, description, status, created_at")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  const { data: archivedProducts } = await supabase
    .from("products")
    .select("id, name, description, status, created_at")
    .eq("status", "archived")
    .order("created_at", { ascending: false });

  const { count: campaignCount } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("archived", false);

  const { count: contentCount } = await supabase
    .from("content_pieces")
    .select("*", { count: "exact", head: true })
    .eq("archived", false);

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Welcome back. Here&apos;s your overview.
          </p>
        </div>
        <Link
          href="/products/new"
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          New Product
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.03]">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Products</p>
          <p className="mt-2 text-3xl font-bold">{activeProducts?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.03]">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Campaign Angles</p>
          <p className="mt-2 text-3xl font-bold">{campaignCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.03]">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Content Pieces</p>
          <p className="mt-2 text-3xl font-bold">{contentCount ?? 0}</p>
        </div>
      </div>

      {/* Active Products */}
      {activeProducts && activeProducts.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Active Products</h2>
          <div className="mt-4 space-y-3">
            {activeProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}/brain`}
                className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.1] hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={product.status} />
                    <ProductDeleteButton productId={product.id} productName={product.name} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-white/[0.08] p-12 text-center">
          <h2 className="text-lg font-semibold">No products yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Create your first product to generate avatars, campaigns, and
            content.
          </p>
          <Link
            href="/products/new"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Create Product
          </Link>
        </div>
      )}

      {/* Archived Products */}
      {archivedProducts && archivedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">Archived</h2>
          <div className="mt-4 space-y-3">
            {archivedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}/brain`}
                className="block rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-zinc-400">{product.name}</h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={product.status} />
                    <ProductDeleteButton productId={product.id} productName={product.name} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
