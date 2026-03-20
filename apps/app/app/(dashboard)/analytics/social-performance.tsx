// apps/app/app/(dashboard)/analytics/social-performance.tsx
"use client";

import { useState } from "react";
import { refreshMetricoolAnalytics } from "@/server/actions/metricool";
import { NETWORK_LABELS } from "@/lib/metricool/types";

interface AnalyticsRow {
  platform: string;
  date: string;
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  profile_views: number;
}

export function SocialPerformance({ data }: { data: AnalyticsRow[] }) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshMetricoolAnalytics();
    setRefreshing(false);
  }

  // Group by platform, latest entry per platform
  const latestByPlatform = new Map<string, AnalyticsRow>();
  for (const row of data) {
    const existing = latestByPlatform.get(row.platform);
    if (!existing || row.date > existing.date) {
      latestByPlatform.set(row.platform, row);
    }
  }

  const platforms = Array.from(latestByPlatform.values());

  if (platforms.length === 0 && data.length === 0) {
    return (
      <div className="mb-8 rounded-xl border border-dashed border-line p-6 text-center">
        <p className="text-sm text-content-muted">
          No social analytics yet. Connect Metricool and sync to see platform metrics.
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {refreshing ? "Syncing..." : "Sync Now"}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Social Performance</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg border border-line px-3 py-1.5 text-xs text-content-muted transition-colors hover:border-zinc-400 disabled:opacity-50"
        >
          {refreshing ? "Syncing..." : "Refresh Metrics"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((p) => (
          <div
            key={p.platform}
            className="rounded-xl border border-line bg-surface-card p-4"
          >
            <h3 className="mb-3 text-sm font-medium">
              {NETWORK_LABELS[p.platform.toUpperCase()] ?? p.platform}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-content-muted">Followers</p>
                <p className="font-semibold">{p.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-content-muted">Reach</p>
                <p className="font-semibold">{p.reach.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-content-muted">Impressions</p>
                <p className="font-semibold">{p.impressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-content-muted">Engagement</p>
                <p className="font-semibold">{p.engagement.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
