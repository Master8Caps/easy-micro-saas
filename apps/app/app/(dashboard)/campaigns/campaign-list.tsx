"use client";

import { useState } from "react";
import { ChannelPill, TypePill } from "@/components/pills";
import { CampaignPanel } from "./campaign-panel";

interface CampaignRow {
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

interface CampaignListProps {
  campaigns: CampaignRow[];
  contentCounts: Record<string, number>;
}

export function CampaignList({ campaigns, contentCounts }: CampaignListProps) {
  const [activeTab, setActiveTab] = useState<"social" | "email" | "ad">("social");
  const [productFilter, setProductFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRow | null>(
    null,
  );

  const socialCampaigns = campaigns.filter((c) => (c.category ?? "social") === "social" && c.channel !== "Email");
  const emailCampaigns = campaigns.filter((c) => (c.category ?? "social") === "social" && c.channel === "Email");
  const adCampaigns = campaigns.filter((c) => c.category === "ad");
  const hasAds = adCampaigns.length > 0;
  const hasEmail = emailCampaigns.length > 0;

  const activeCampaigns =
    activeTab === "email" ? emailCampaigns :
    activeTab === "ad" ? adCampaigns :
    socialCampaigns;

  // Build unique product and channel lists for filters from active tab
  const products = Array.from(
    new Map(
      activeCampaigns
        .filter((c) => c.products)
        .map((c) => [c.product_id, c.products!.name]),
    ),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const channels = Array.from(
    new Set(activeCampaigns.map((c) => c.channel)),
  ).sort();

  const filtered = activeCampaigns.filter((c) => {
    if (productFilter && c.product_id !== productFilter) return false;
    if (channelFilter && c.channel !== channelFilter) return false;
    return true;
  });

  return (
    <>
      {/* Tabs + count */}
      <div className="mb-4 flex items-center justify-between">
        {(hasAds || hasEmail) ? (
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
            <button
              onClick={() => { setActiveTab("social"); setProductFilter(""); setChannelFilter(""); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "social"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Social
              <span className={`ml-1.5 ${activeTab === "social" ? "text-zinc-500" : "text-zinc-600"}`}>
                {socialCampaigns.length}
              </span>
            </button>
            {hasEmail && (
              <button
                onClick={() => { setActiveTab("email"); setProductFilter(""); setChannelFilter(""); }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "email"
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Email
                <span className={`ml-1.5 ${activeTab === "email" ? "text-zinc-500" : "text-zinc-600"}`}>
                  {emailCampaigns.length}
                </span>
              </button>
            )}
            {hasAds && (
              <button
                onClick={() => { setActiveTab("ad"); setProductFilter(""); setChannelFilter(""); }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "ad"
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Ads
                <span className={`ml-1.5 ${activeTab === "ad" ? "text-zinc-500" : "text-zinc-600"}`}>
                  {adCampaigns.length}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div />
        )}
        <span className="text-sm text-zinc-500">
          {filtered.length} campaign{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
        >
          <option value="">All products</option>
          {products.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
        >
          <option value="">All {activeTab === "ad" ? "platforms" : "channels"}</option>
          {channels.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
      </div>

      {/* Campaign cards */}
      <div className="space-y-4">
        {filtered.map((campaign) => {
          const count = contentCounts[campaign.id] ?? 0;

          return (
            <button
              key={campaign.id}
              onClick={() => setSelectedCampaign(campaign)}
              className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              {/* Product name prominently at top */}
              {campaign.products && (
                <p className="mb-2 text-sm font-medium text-zinc-400">
                  {campaign.products.name}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <ChannelPill channel={campaign.channel} />
                <TypePill type={campaign.content_type} />
                {campaign.avatars && (
                  <span className="text-xs text-zinc-500">
                    for {campaign.avatars.name}
                  </span>
                )}
              </div>

              <h3 className="mt-3 font-semibold">{campaign.angle}</h3>
              <p className="mt-1 text-sm italic text-zinc-400">
                &ldquo;{campaign.hook}&rdquo;
              </p>

              {count > 0 && (
                <p className="mt-3 text-xs text-zinc-500">
                  {count} content piece{count === 1 ? "" : "s"} generated
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Slide-over panel */}
      {selectedCampaign && (
        <CampaignPanel
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </>
  );
}
