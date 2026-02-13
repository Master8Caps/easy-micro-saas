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
  destination_url: string | null;
  created_at: string;
  products: { name: string } | null;
  avatars: { name: string } | null;
}

interface CampaignListProps {
  campaigns: CampaignRow[];
  contentCounts: Record<string, number>;
  clickCounts: Record<string, number>;
}

export function CampaignList({ campaigns, contentCounts, clickCounts }: CampaignListProps) {
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
          <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
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
                {activeTab === "social" ? filtered.length : socialCampaigns.length}
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
                  {activeTab === "email" ? filtered.length : emailCampaigns.length}
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
                  {activeTab === "ad" ? filtered.length : adCampaigns.length}
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
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
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
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
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
              className="block w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-left transition-all hover:border-white/[0.1] hover:bg-white/[0.03]"
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

              <div className="mt-3 flex items-center gap-3">
                {count > 0 && (
                  <span className="text-xs text-zinc-500">
                    {count} content piece{count === 1 ? "" : "s"} generated
                  </span>
                )}
                {campaign.destination_url && (
                  <span className="flex items-center gap-1 text-xs text-indigo-400/70">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Tracked
                  </span>
                )}
                {(clickCounts[campaign.id] ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 15l-2 5L9 9l11 4-5 2z" />
                    </svg>
                    {clickCounts[campaign.id]} click{clickCounts[campaign.id] === 1 ? "" : "s"}
                  </span>
                )}
              </div>
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
