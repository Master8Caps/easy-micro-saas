"use client";

import { useState, useMemo, useEffect } from "react";
import { CopyButton } from "@/components/copy-button";
import {
  loadPerformanceScores,
  type PerformanceData,
} from "@/server/actions/performance";
import { getScoreTier, scoreBarColor } from "@/lib/score-utils";

interface LinkRow {
  id: string;
  slug: string;
  product_id: string;
  campaign_id: string | null;
  content_piece_id: string | null;
  destination_url: string;
  utm_source: string;
  utm_medium: string;
  click_count: number;
  created_at: string;
  campaigns: { angle: string; channel: string } | null;
  content_pieces: { title: string } | null;
  products: { name: string } | null;
}

interface AnalyticsDashboardProps {
  products: { id: string; name: string }[];
  links: LinkRow[];
  recentClicks: { clicked_at: string; link_id: string }[];
}

export function AnalyticsDashboard({
  products,
  links,
  recentClicks,
}: AnalyticsDashboardProps) {
  const [productFilter, setProductFilter] = useState("");
  const [perfData, setPerfData] = useState<PerformanceData | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  useEffect(() => {
    if (!productFilter) {
      setPerfData(null);
      return;
    }
    setPerfLoading(true);
    loadPerformanceScores({ productId: productFilter }).then((result) => {
      if ("campaigns" in result) setPerfData(result);
      setPerfLoading(false);
    });
  }, [productFilter]);

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "";

  const filteredLinks = useMemo(
    () =>
      productFilter
        ? links.filter((l) => l.product_id === productFilter)
        : links,
    [links, productFilter],
  );

  const filteredClickLinkIds = useMemo(
    () => new Set(filteredLinks.map((l) => l.id)),
    [filteredLinks],
  );

  const filteredClicks = useMemo(
    () => recentClicks.filter((c) => filteredClickLinkIds.has(c.link_id)),
    [recentClicks, filteredClickLinkIds],
  );

  // Stats
  const totalClicks = filteredLinks.reduce(
    (sum, l) => sum + (l.click_count ?? 0),
    0,
  );
  const totalLinks = filteredLinks.length;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const clicks7d = filteredClicks.filter(
    (c) => new Date(c.clicked_at) >= sevenDaysAgo,
  ).length;
  const clicks30d = filteredClicks.length;

  // Clicks by channel
  const byChannel = useMemo(() => {
    const map: Record<string, number> = {};
    for (const link of filteredLinks) {
      const ch = link.utm_source || "unknown";
      map[ch] = (map[ch] ?? 0) + (link.click_count ?? 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredLinks]);

  // Daily clicks (last 30 days)
  const dailyClicks = useMemo(() => {
    const map: Record<string, number> = {};
    for (const click of filteredClicks) {
      const date = click.clicked_at.split("T")[0];
      map[date] = (map[date] ?? 0) + 1;
    }
    // Fill in missing days
    const days: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({ date: key, count: map[key] ?? 0 });
    }
    return days;
  }, [filteredClicks]);

  const maxDailyClicks = Math.max(...dailyClicks.map((d) => d.count), 1);

  const hasData = totalLinks > 0;

  return (
    <>
      {/* Product filter */}
      <div className="mb-6">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="rounded-lg border border-line bg-surface-secondary px-3 py-2 text-sm text-content-secondary focus:border-indigo-500/50 focus:outline-none [&>option]:bg-surface-secondary [&>option]:text-content-secondary"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed border-line p-12 text-center">
          <h2 className="text-lg font-semibold">No tracked links yet</h2>
          <p className="mt-2 text-sm text-content-muted">
            Set a destination URL on a campaign and generate content to create
            tracked links. Analytics will appear here once links are clicked.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryCard label="Total Clicks" value={totalClicks} />
            <SummaryCard label="Last 7 Days" value={clicks7d} />
            <SummaryCard label="Last 30 Days" value={clicks30d} />
            <SummaryCard label="Active Links" value={totalLinks} />
          </div>

          {/* Daily clicks chart */}
          <div className="mb-8 rounded-xl border border-line bg-surface-card p-6">
            <h3 className="mb-4 text-sm font-medium text-content-secondary">
              Clicks — Last 30 Days
            </h3>
            <div className="flex h-32 items-end gap-1">
              {dailyClicks.map((day) => (
                <div
                  key={day.date}
                  className="group relative flex-1"
                  title={`${day.date}: ${day.count} click${day.count === 1 ? "" : "s"}`}
                >
                  <div
                    className="w-full rounded-t bg-indigo-500/60 transition-colors group-hover:bg-indigo-400/80"
                    style={{
                      height: `${Math.max((day.count / maxDailyClicks) * 100, day.count > 0 ? 4 : 0)}%`,
                      minHeight: day.count > 0 ? "4px" : "0px",
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-content-muted">
              <span>{dailyClicks[0]?.date.slice(5)}</span>
              <span>{dailyClicks[dailyClicks.length - 1]?.date.slice(5)}</span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Top links table */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-line bg-surface-card p-6">
                <h3 className="mb-4 text-sm font-medium text-content-secondary">
                  Top Performing Links
                </h3>
                <div className="space-y-3">
                  {filteredLinks.slice(0, 10).map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 rounded-lg bg-surface-card px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-content-primary">
                          {link.content_pieces?.title ??
                            link.campaigns?.angle ??
                            "Untitled"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-400">
                            /r/{link.slug}
                          </span>
                          {link.products && (
                            <span className="text-xs text-content-muted">
                              {link.products.name}
                            </span>
                          )}
                          {link.campaigns?.channel && (
                            <span className="rounded bg-surface-card-hover px-1.5 py-0.5 text-xs text-content-muted">
                              {link.campaigns.channel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold tabular-nums text-content-primary">
                          {link.click_count}
                        </span>
                        <CopyButton text={`${baseUrl}/r/${link.slug}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Clicks by channel */}
            <div>
              <div className="rounded-xl border border-line bg-surface-card p-6">
                <h3 className="mb-4 text-sm font-medium text-content-secondary">
                  Clicks by Channel
                </h3>
                {byChannel.length > 0 ? (
                  <div className="space-y-3">
                    {byChannel.map(([channel, count]) => {
                      const pct =
                        totalClicks > 0
                          ? Math.round((count / totalClicks) * 100)
                          : 0;
                      return (
                        <div key={channel}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="capitalize text-content-secondary">
                              {channel}
                            </span>
                            <span className="tabular-nums text-content-muted">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-surface-card-hover">
                            <div
                              className="h-2 rounded-full bg-indigo-500/60"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-content-muted">No click data yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Performance Scores — shown when a product is selected */}
          {productFilter && perfLoading && (
            <div className="mt-8 flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
            </div>
          )}
          {productFilter && perfData && perfData.hasData && !perfLoading && (
            <div className="mt-8">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-content-muted">
                Performance Scores
              </h3>
              <div className="grid gap-6 lg:grid-cols-3">
                {/* By Avatar */}
                <div className="rounded-xl border border-line bg-surface-card p-6">
                  <h4 className="mb-4 text-sm font-medium text-content-secondary">By Avatar</h4>
                  <div className="space-y-3">
                    {[...perfData.avatars]
                      .sort((a, b) => b.normalizedScore - a.normalizedScore)
                      .map((avatar) => {
                        const tier = getScoreTier(avatar.normalizedScore);
                        return (
                          <div key={avatar.avatarId}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="truncate pr-2 text-content-secondary">{avatar.name}</span>
                              <span className="shrink-0 tabular-nums text-content-muted">
                                {avatar.totalClicks}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-surface-card-hover">
                              <div
                                className={`h-2 rounded-full ${scoreBarColor(tier.color)}`}
                                style={{ width: `${Math.max(avatar.normalizedScore, avatar.totalClicks > 0 ? 4 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* By Channel */}
                <div className="rounded-xl border border-line bg-surface-card p-6">
                  <h4 className="mb-4 text-sm font-medium text-content-secondary">By Channel</h4>
                  <div className="space-y-3">
                    {perfData.channels.map((ch) => {
                      const tier = getScoreTier(ch.normalizedScore);
                      return (
                        <div key={ch.channel}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-content-secondary">{ch.channel}</span>
                            <span className="tabular-nums text-content-muted">
                              {ch.totalClicks}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-surface-card-hover">
                            <div
                              className={`h-2 rounded-full ${scoreBarColor(tier.color)}`}
                              style={{ width: `${Math.max(ch.normalizedScore, ch.totalClicks > 0 ? 4 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Campaign Angles */}
                <div className="rounded-xl border border-line bg-surface-card p-6">
                  <h4 className="mb-4 text-sm font-medium text-content-secondary">Top Campaign Angles</h4>
                  <div className="space-y-3">
                    {[...perfData.campaigns]
                      .sort((a, b) => b.normalizedScore - a.normalizedScore)
                      .slice(0, 8)
                      .map((c) => {
                        const tier = getScoreTier(c.normalizedScore);
                        return (
                          <div key={c.campaignId}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="truncate pr-2 text-content-secondary">{c.angle}</span>
                              <span className="shrink-0 tabular-nums text-content-muted">
                                {c.totalClicks}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-surface-card-hover">
                              <div
                                className={`h-1.5 rounded-full ${scoreBarColor(tier.color)}`}
                                style={{ width: `${Math.max(c.normalizedScore, c.totalClicks > 0 ? 4 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
          {productFilter && perfData && !perfData.hasData && !perfLoading && (
            <div className="mt-8 rounded-xl border border-dashed border-line p-8 text-center">
              <p className="text-sm text-content-muted">
                No performance data yet. Scores will appear once tracked links receive clicks.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-content-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}
