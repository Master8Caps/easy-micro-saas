"use client";

import { useState } from "react";
import Link from "next/link";

interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  objective: string;
  status: string;
  daily_budget: number;
  currency: string;
  created_at: string;
  products: { name: string } | null;
  ad_sets: Array<{ id: string; ads: Array<{ id: string }> }>;
}

interface Product {
  id: string;
  name: string;
}

const platformLabels: Record<string, string> = {
  meta: "Meta",
  google: "Google",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

const statusColors: Record<string, string> = {
  draft: "bg-surface-hover text-content-muted",
  active: "bg-green-500/10 text-green-400",
  paused: "bg-yellow-500/10 text-yellow-400",
  completed: "bg-blue-500/10 text-blue-400",
};

export function AdsList({
  campaigns,
  products,
}: {
  campaigns: AdCampaign[];
  products: Product[];
}) {
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  const filtered = campaigns.filter((c) => {
    if (platformFilter !== "all" && c.platform !== platformFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (productFilter !== "all" && c.products?.name !== productFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-content"
        >
          <option value="all">All Platforms</option>
          <option value="meta">Meta</option>
          <option value="google">Google</option>
          <option value="linkedin">LinkedIn</option>
          <option value="tiktok">TikTok</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-content"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-content"
        >
          <option value="all">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <Link
          href="/ads/new"
          className="ml-auto rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand/90"
        >
          New Campaign
        </Link>
      </div>

      {/* Campaign list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface-card p-8 text-center">
          <p className="text-content-muted">No ad campaigns yet.</p>
          <Link
            href="/ads/new"
            className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
          >
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => {
            const adCount = campaign.ad_sets.reduce(
              (sum, set) => sum + set.ads.length,
              0,
            );
            return (
              <Link
                key={campaign.id}
                href={`/ads/${campaign.id}`}
                className="block rounded-lg border border-line bg-surface-card p-4 transition-colors hover:border-brand/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-content">
                        {campaign.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[campaign.status] ?? ""}`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-content-muted">
                      <span>{platformLabels[campaign.platform] ?? campaign.platform}</span>
                      <span>&middot;</span>
                      <span>{campaign.objective}</span>
                      <span>&middot;</span>
                      <span>
                        {campaign.currency} {campaign.daily_budget}/day
                      </span>
                      <span>&middot;</span>
                      <span>{adCount} ad{adCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  {campaign.products && (
                    <span className="text-xs text-content-muted">
                      {campaign.products.name}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
