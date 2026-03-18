"use client";

import { useState, useMemo } from "react";
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

const platformTabs = [
  { value: "", label: "All" },
  { value: "meta", label: "Meta" },
  { value: "google", label: "Google" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
];

const statusColors: Record<string, string> = {
  draft: "bg-surface-tertiary text-content-muted",
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
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const platformCounts = useMemo(() => {
    const visible = campaigns.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (productFilter && c.products?.name !== productFilter) return false;
      return true;
    });
    const counts: Record<string, number> = { "": visible.length };
    for (const c of visible) {
      counts[c.platform] = (counts[c.platform] ?? 0) + 1;
    }
    return counts;
  }, [campaigns, statusFilter, productFilter]);

  const filtered = useMemo(
    () =>
      campaigns.filter((c) => {
        if (platformFilter && c.platform !== platformFilter) return false;
        if (statusFilter && c.status !== statusFilter) return false;
        if (productFilter && c.products?.name !== productFilter) return false;
        return true;
      }),
    [campaigns, platformFilter, statusFilter, productFilter],
  );

  return (
    <div>
      {/* Row 1: Platform tabs + count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-line bg-surface-card p-1">
          {platformTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPlatformFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                platformFilter === tab.value
                  ? "bg-brand text-white"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              {tab.label}
              {(platformCounts[tab.value] ?? 0) > 0 && (
                <span className={`ml-1.5 ${platformFilter === tab.value ? "text-white/60" : "text-content-muted"}`}>
                  {platformCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="text-sm text-content-muted">
          {filtered.length} campaign{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Row 2: Secondary filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-line bg-surface-card px-3 py-2 text-sm text-content-secondary"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="rounded-lg border border-line bg-surface-card px-3 py-2 text-sm text-content-secondary"
        >
          <option value="">All products</option>
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
                      <h3 className="font-medium text-content-primary">
                        {campaign.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[campaign.status] ?? ""}`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-content-muted">
                      <span>{platformTabs.find((t) => t.value === campaign.platform)?.label ?? campaign.platform}</span>
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
