// apps/app/components/metricool-performance-card.tsx
"use client";

import { useState, useEffect } from "react";
import { getMetricoolPostsForContent, refreshMetricoolAnalytics } from "@/server/actions/metricool";
import { NETWORK_LABELS } from "@/lib/metricool/types";

interface MetricoolPost {
  id: string;
  platform: string;
  status: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  shares: number;
  scheduled_at: string | null;
  posted_at: string | null;
  last_synced_at: string | null;
}

export function MetricoolPerformanceCard({ contentPieceId }: { contentPieceId: string }) {
  const [posts, setPosts] = useState<MetricoolPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function loadPosts() {
    getMetricoolPostsForContent(contentPieceId).then((res) => {
      if (res.data) setPosts(res.data as MetricoolPost[]);
      setLoading(false);
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refreshMetricoolAnalytics();
    loadPosts();
    setRefreshing(false);
  }

  useEffect(() => {
    loadPosts();
  }, [contentPieceId]);

  if (loading) return null;
  if (posts.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-line bg-surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">Metricool Performance</h4>
        <div className="flex items-center gap-2">
          {posts[0]?.last_synced_at && (
            <span className="text-xs text-content-muted">
              Synced {new Date(posts[0].last_synced_at).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-md border border-line px-2 py-0.5 text-xs text-content-muted hover:border-zinc-400 disabled:opacity-50"
          >
            {refreshing ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center gap-3">
            {/* Platform badge */}
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
              post.status === "posted"
                ? "bg-green-500/10 text-green-400"
                : post.status === "scheduled"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400"
            }`}>
              {NETWORK_LABELS[post.platform.toUpperCase()] ?? post.platform}
            </span>

            {/* Stats */}
            {post.status === "posted" ? (
              <div className="flex flex-wrap gap-4 text-xs text-content-muted">
                <span>{post.impressions.toLocaleString()} impressions</span>
                <span>{post.reach.toLocaleString()} reach</span>
                <span>{post.engagement.toLocaleString()} engagement</span>
                <span>{post.clicks.toLocaleString()} clicks</span>
                <span>{post.shares.toLocaleString()} shares</span>
              </div>
            ) : (
              <span className="text-xs text-content-muted">
                {post.status === "scheduled" && post.scheduled_at
                  ? `Scheduled for ${new Date(post.scheduled_at).toLocaleString()}`
                  : post.status}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
