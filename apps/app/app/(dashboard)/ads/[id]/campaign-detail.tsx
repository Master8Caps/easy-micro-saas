"use client";

import { useState } from "react";
import Link from "next/link";
import { updateAdCampaign } from "@/server/actions/ad-campaigns";
import { upsertPerformance } from "@/server/actions/ad-performance";
import { updateRecommendation } from "@/server/actions/ad-optimization";

interface CampaignDetailProps {
  campaign: Record<string, unknown> & {
    id: string;
    name: string;
    platform: string;
    objective: string;
    status: string;
    daily_budget: number;
    total_budget: number;
    currency: string;
    product_id: string;
    products: { name: string } | null;
    ad_sets: Array<Record<string, unknown>>;
  };
  performance: Array<{
    id: string;
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    conversion_value: number;
    ctr: number;
    roas: number;
    cpc: number;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    summary: string;
    status: string;
  }>;
}

const statusActions: Record<string, { label: string; next: string }[]> = {
  draft: [{ label: "Activate", next: "active" }],
  active: [
    { label: "Pause", next: "paused" },
    { label: "Complete", next: "completed" },
  ],
  paused: [
    { label: "Resume", next: "active" },
    { label: "Complete", next: "completed" },
  ],
  completed: [],
};

export function CampaignDetail({
  campaign,
  performance,
  recommendations,
}: CampaignDetailProps) {
  const [showPerfForm, setShowPerfForm] = useState(false);
  const [perfDate, setPerfDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [perfSpend, setPerfSpend] = useState(0);
  const [perfImpressions, setPerfImpressions] = useState(0);
  const [perfClicks, setPerfClicks] = useState(0);
  const [perfConversions, setPerfConversions] = useState(0);
  const [perfConversionValue, setPerfConversionValue] = useState(0);
  const [saving, setSaving] = useState(false);

  // Summary stats
  const totalSpend = performance.reduce((s, r) => s + Number(r.spend), 0);
  const totalClicks = performance.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = performance.reduce(
    (s, r) => s + r.impressions,
    0,
  );
  const totalConversions = performance.reduce(
    (s, r) => s + r.conversions,
    0,
  );
  const avgCtr =
    totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgRoas =
    totalSpend > 0
      ? performance.reduce((s, r) => s + Number(r.conversion_value), 0) /
        totalSpend
      : 0;

  async function handleStatusChange(newStatus: string) {
    await updateAdCampaign(campaign.id, { status: newStatus });
  }

  async function handleSavePerformance() {
    setSaving(true);
    await upsertPerformance({
      adCampaignId: campaign.id,
      productId: campaign.product_id,
      date: perfDate,
      spend: perfSpend,
      impressions: perfImpressions,
      clicks: perfClicks,
      conversions: perfConversions,
      conversionValue: perfConversionValue,
    });
    setSaving(false);
    setShowPerfForm(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/ads"
            className="text-xs text-content-muted hover:text-content"
          >
            &larr; Back to campaigns
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-bold">
            {campaign.name}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-content-muted">
            <span>{campaign.platform}</span>
            <span>&middot;</span>
            <span>{campaign.objective}</span>
            <span>&middot;</span>
            <span>
              {campaign.currency} {campaign.daily_budget}/day
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {(statusActions[campaign.status] ?? []).map((action) => (
            <button
              key={action.next}
              onClick={() => handleStatusChange(action.next)}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-content-muted hover:bg-surface-hover"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      {performance.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Total Spend", value: `$${totalSpend.toFixed(2)}` },
            { label: "Clicks", value: totalClicks.toLocaleString() },
            { label: "CTR", value: `${avgCtr.toFixed(2)}%` },
            { label: "ROAS", value: `${avgRoas.toFixed(2)}x` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-line bg-surface-card p-3"
            >
              <p className="text-xs text-content-muted">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-content">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-heading text-lg font-semibold">
            Recommendations
          </h2>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-lg border border-line bg-surface-card p-3"
              >
                <div>
                  <span className="mr-2 rounded bg-brand/10 px-1.5 py-0.5 text-xs font-medium text-brand">
                    {rec.type.replace("_", " ")}
                  </span>
                  <span className="text-sm text-content">{rec.summary}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateRecommendation(rec.id, "accepted")}
                    className="rounded px-2 py-1 text-xs text-green-400 hover:bg-green-500/10"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateRecommendation(rec.id, "dismissed")}
                    className="rounded px-2 py-1 text-xs text-content-muted hover:bg-surface-hover"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Data */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">
            Performance Data
          </h2>
          <button
            onClick={() => setShowPerfForm(!showPerfForm)}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90"
          >
            {showPerfForm ? "Cancel" : "Log Performance"}
          </button>
        </div>

        {/* Performance entry form */}
        {showPerfForm && (
          <div className="mb-4 rounded-lg border border-line bg-surface-card p-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-content-muted">
                  Date
                </label>
                <input
                  type="date"
                  value={perfDate}
                  onChange={(e) => setPerfDate(e.target.value)}
                  className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-content"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-content-muted">
                  Spend ($)
                </label>
                <input
                  type="number"
                  value={perfSpend}
                  onChange={(e) => setPerfSpend(Number(e.target.value))}
                  min={0}
                  step={0.01}
                  className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-content"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-content-muted">
                  Impressions
                </label>
                <input
                  type="number"
                  value={perfImpressions}
                  onChange={(e) => setPerfImpressions(Number(e.target.value))}
                  min={0}
                  className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-content"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-content-muted">
                  Clicks
                </label>
                <input
                  type="number"
                  value={perfClicks}
                  onChange={(e) => setPerfClicks(Number(e.target.value))}
                  min={0}
                  className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-content"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-content-muted">
                  Conversions
                </label>
                <input
                  type="number"
                  value={perfConversions}
                  onChange={(e) => setPerfConversions(Number(e.target.value))}
                  min={0}
                  className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-content"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-content-muted">
                  Conversion Value ($)
                </label>
                <input
                  type="number"
                  value={perfConversionValue}
                  onChange={(e) =>
                    setPerfConversionValue(Number(e.target.value))
                  }
                  min={0}
                  step={0.01}
                  className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-content"
                />
              </div>
            </div>
            <button
              onClick={handleSavePerformance}
              disabled={saving}
              className="mt-3 rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}

        {/* Performance table */}
        {performance.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-card text-left text-xs text-content-muted">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Spend</th>
                  <th className="px-3 py-2">Impr.</th>
                  <th className="px-3 py-2">Clicks</th>
                  <th className="px-3 py-2">CTR</th>
                  <th className="px-3 py-2">Conv.</th>
                  <th className="px-3 py-2">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-3 py-2 text-content">{row.date}</td>
                    <td className="px-3 py-2 text-content">
                      ${Number(row.spend).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-content">
                      {row.impressions.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-content">{row.clicks}</td>
                    <td className="px-3 py-2 text-content">
                      {(Number(row.ctr) * 100).toFixed(2)}%
                    </td>
                    <td className="px-3 py-2 text-content">
                      {row.conversions}
                    </td>
                    <td className="px-3 py-2 text-content">
                      {Number(row.roas).toFixed(2)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface-card p-6 text-center text-sm text-content-muted">
            No performance data yet. Deploy your ads and log results to start
            optimizing.
          </div>
        )}
      </div>
    </div>
  );
}
