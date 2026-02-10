import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const statusStyles: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  archived: "border-zinc-600/30 bg-zinc-600/10 text-zinc-500",
};

function StatusPill({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? statusStyles.draft}`}
    >
      {label}
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, status, created_at")
    .order("created_at", { ascending: false });

  const { count: campaignCount } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true });

  const { count: contentCount } = await supabase
    .from("content_pieces")
    .select("*", { count: "exact", head: true });

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-zinc-400">
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Products</p>
          <p className="mt-2 text-3xl font-bold">{products?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Campaign Angles</p>
          <p className="mt-2 text-3xl font-bold">{campaignCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">Content Pieces</p>
          <p className="mt-2 text-3xl font-bold">{contentCount ?? 0}</p>
        </div>
      </div>

      {products && products.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Your Products</h2>
          <div className="mt-4 space-y-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}/brain`}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {product.description}
                    </p>
                  </div>
                  <StatusPill status={product.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-700 p-12 text-center">
          <h2 className="text-lg font-semibold">No products yet</h2>
          <p className="mt-2 text-zinc-400">
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
    </>
  );
}
