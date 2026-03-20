// apps/app/components/metricool-publish-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { publishContentToMetricool, getMetricoolBestTimes } from "@/server/actions/metricool";
import { CONTENT_TYPE_TO_NETWORK, NETWORK_LABELS, ALL_NETWORKS } from "@/lib/metricool/types";
import type { BestTimeSlot } from "@/lib/metricool/types";

interface Props {
  contentPieceId: string;
  contentType: string;
  contentBody: string;
  imageUrl: string | null;
  scheduledFor: string | null;
  onClose: () => void;
  onPublished: () => void;
}

export function MetricoolPublishModal({
  contentPieceId,
  contentType,
  contentBody,
  imageUrl,
  scheduledFor,
  onClose,
  onPublished,
}: Props) {
  const defaultNetwork = CONTENT_TYPE_TO_NETWORK[contentType];
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(
    defaultNetwork ? [defaultNetwork] : [],
  );
  const [scheduledAt, setScheduledAt] = useState(
    scheduledFor ?? new Date(Date.now() + 3600_000).toISOString().slice(0, 16),
  );
  const [bestTimes, setBestTimes] = useState<BestTimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch best times for the first selected network
  useEffect(() => {
    if (selectedNetworks.length === 0) return;
    getMetricoolBestTimes(selectedNetworks[0]).then((res) => {
      if (res.data) setBestTimes(res.data);
    });
  }, [selectedNetworks]);

  function toggleNetwork(network: string) {
    setSelectedNetworks((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network],
    );
  }

  async function handlePublish() {
    if (selectedNetworks.length === 0) return;
    setLoading(true);
    setError(null);

    const result = await publishContentToMetricool({
      contentPieceId,
      networks: selectedNetworks,
      scheduledAt: new Date(scheduledAt).toISOString(),
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onPublished();
      onClose();
    }
  }

  const topBestTime = bestTimes.length > 0
    ? bestTimes.sort((a, b) => b.score - a.score)[0]
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-surface-primary shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold">Publish to Metricool</h2>
          <button
            onClick={onClose}
            className="text-content-muted hover:text-content-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Platform selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {ALL_NETWORKS.map((network) => (
                <button
                  key={network}
                  onClick={() => toggleNetwork(network)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedNetworks.includes(network)
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                      : "border-line text-content-muted hover:border-zinc-400"
                  }`}
                >
                  {NETWORK_LABELS[network]}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule time */}
          <div>
            <label className="mb-2 block text-sm font-medium">Schedule for</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-sm"
            />
            {topBestTime && (
              <p className="mt-1 text-xs text-content-muted">
                💡 Best time suggestion: {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][topBestTime.day]} at {topBestTime.hour}:00
              </p>
            )}
          </div>

          {/* Content preview */}
          <div>
            <label className="mb-2 block text-sm font-medium">Preview</label>
            <div className="rounded-lg border border-line bg-surface-card p-3">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  className="mb-2 h-32 w-full rounded-md object-cover"
                />
              )}
              <p className="whitespace-pre-wrap text-sm text-content-secondary line-clamp-6">
                {contentBody}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line px-6 py-4">
          <button
            onClick={handlePublish}
            disabled={loading || selectedNetworks.length === 0}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Publishing..." : `Schedule on ${selectedNetworks.length} platform${selectedNetworks.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </>
  );
}
