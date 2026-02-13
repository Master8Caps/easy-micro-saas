"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProductStatus } from "@/server/actions/products";
import { ChannelPill, TypePill } from "@/components/pills";
import { useUser } from "@/components/user-context";
import { CampaignPanel } from "@/app/(dashboard)/campaigns/campaign-panel";

interface ArchivedProduct {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

interface ArchivedCampaign {
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
}

interface ArchiveListProps {
  products: ArchivedProduct[];
  campaigns: ArchivedCampaign[];
  campaignCounts: Record<string, number>;
  contentCounts: Record<string, number>;
}

export function ArchiveList({
  products,
  campaigns,
  campaignCounts,
  contentCounts,
}: ArchiveListProps) {
  const { role } = useUser();
  const isAdmin = role === "admin";
  const router = useRouter();
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<ArchivedCampaign | null>(null);

  async function handleReactivate(productId: string) {
    setReactivating(productId);
    const result = await updateProductStatus(productId, "active");
    if (!result.error) {
      router.refresh();
    }
    setReactivating(null);
  }

  return (
    <div className="space-y-4">
      {products.map((product) => {
        const isExpanded = expandedProduct === product.id;
        const productCampaigns = campaigns.filter(
          (c) => c.product_id === product.id,
        );
        const campCount = campaignCounts[product.id] ?? 0;
        const contCount = contentCounts[product.id] ?? 0;

        return (
          <div
            key={product.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02]"
          >
            <button
              onClick={() =>
                setExpandedProduct(isExpanded ? null : product.id)
              }
              className="w-full rounded-xl p-6 text-left transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {product.description}
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-zinc-500">
                    <span>
                      {campCount} campaign{campCount === 1 ? "" : "s"}
                    </span>
                    <span>
                      {contCount} content piece{contCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                    Archived
                  </span>
                  <span
                    className={`text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-white/[0.06] p-6">
                {isAdmin && (
                  <div className="mb-4">
                    <button
                      onClick={() => handleReactivate(product.id)}
                      disabled={reactivating === product.id}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {reactivating === product.id
                        ? "Reactivating..."
                        : "Reactivate Product"}
                    </button>
                  </div>
                )}

                {productCampaigns.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-zinc-400">
                      Archived Campaigns
                    </h4>
                    {productCampaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => setSelectedCampaign(campaign)}
                        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:border-white/[0.1] hover:bg-white/[0.03]"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <ChannelPill channel={campaign.channel} />
                          <TypePill type={campaign.content_type} />
                          {campaign.category === "ad" && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                              Ad
                            </span>
                          )}
                          {campaign.avatars && (
                            <span className="text-xs text-zinc-500">
                              for {campaign.avatars.name}
                            </span>
                          )}
                        </div>
                        <h5 className="mt-2 text-sm font-medium">
                          {campaign.angle}
                        </h5>
                        <p className="mt-1 text-xs italic text-zinc-400">
                          &ldquo;{campaign.hook}&rdquo;
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No archived campaigns for this product.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {selectedCampaign && (
        <CampaignPanel
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}
