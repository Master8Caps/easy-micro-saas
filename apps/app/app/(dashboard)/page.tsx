import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusPill } from "@/components/pills";
import { ProductDeleteButton } from "@/components/product-delete-button";
import { getOnboardingProgress } from "@/lib/actions/onboarding";
import { OnboardingChecklist } from "@/components/onboarding-checklist";

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

  const onboarding = await getOnboardingProgress();

  return (
    <>
      {onboarding && (
        <OnboardingChecklist completedSteps={onboarding.completedSteps} />
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-content-muted">
            Welcome back. Here&apos;s your overview.
          </p>
        </div>
        <Link
          href="/products/new"
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-surface-tertiary"
        >
          New Product
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface-card p-6 transition-colors hover:bg-surface-card">
          <p className="text-xs font-medium uppercase tracking-wider text-content-muted">Products</p>
          <p className="mt-2 text-3xl font-bold">{activeProducts?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-card p-6 transition-colors hover:bg-surface-card">
          <p className="text-xs font-medium uppercase tracking-wider text-content-muted">Campaign Angles</p>
          <p className="mt-2 text-3xl font-bold">{campaignCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-card p-6 transition-colors hover:bg-surface-card">
          <p className="text-xs font-medium uppercase tracking-wider text-content-muted">Content Pieces</p>
          <p className="mt-2 text-3xl font-bold">{contentCount ?? 0}</p>
        </div>
      </div>

      {/* Active Products */}
      {activeProducts && activeProducts.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-content-muted">Active Products</h2>
          <div className="mt-4 space-y-3">
            {activeProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}/brain`}
                className="block rounded-xl border border-line bg-surface-card p-6 transition-all hover:border-line hover:bg-surface-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-1 text-sm text-content-muted">
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
        <div className="mt-10 rounded-xl border border-dashed border-line p-12 text-center">
          <h2 className="text-lg font-semibold">No products yet</h2>
          <p className="mt-2 text-sm text-content-muted">
            Create your first product to generate avatars, campaigns, and
            content.
          </p>
          <Link
            href="/products/new"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-surface-tertiary"
          >
            Create Product
          </Link>
        </div>
      )}

      {/* Archived Products */}
      {archivedProducts && archivedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-content-muted">Archived</h2>
          <div className="mt-4 space-y-3">
            {archivedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}/brain`}
                className="block rounded-xl border border-line-subtle bg-surface-card p-6 transition-all hover:border-line hover:bg-surface-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-content-secondary">{product.name}</h3>
                    <p className="mt-1 text-sm text-content-muted">
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
