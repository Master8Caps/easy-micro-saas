"use client";

import { useState } from "react";
import {
  analyzeAndRecommend,
  updateRecommendation,
} from "@/server/actions/ad-optimization";

interface OptimizeDashboardProps {
  products: Array<{ id: string; name: string }>;
  recommendations: Array<{
    id: string;
    type: string;
    summary: string;
    product_id: string;
    created_at: string;
  }>;
  activeCampaigns: Array<{
    id: string;
    name: string;
    platform: string;
    product_id: string;
    daily_budget: number;
  }>;
}

const typeIcons: Record<string, string> = {
  budget_shift: "\u{1F4B0}",
  creative_refresh: "\u{1F3A8}",
  audience_adjust: "\u{1F3AF}",
  pause: "\u23F8\uFE0F",
  scale: "\u{1F4C8}",
};

export function OptimizeDashboard({
  products,
  recommendations,
  activeCampaigns,
}: OptimizeDashboardProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(
    products[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!selectedProduct) return;
    setAnalyzing(true);
    setError(null);

    const result = await analyzeAndRecommend(selectedProduct);
    if (result.error) {
      setError(result.error);
    }
    setAnalyzing(false);
  }

  const productCampaignCount = activeCampaigns.filter(
    (c) => c.product_id === selectedProduct,
  ).length;

  return (
    <div className="mt-6">
      {/* Analyze section */}
      <div className="mb-6 rounded-lg border border-line bg-surface-card p-4">
        <div className="flex items-center gap-3">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-content"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || productCampaignCount < 2}
            className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze Campaigns"}
          </button>
          {productCampaignCount < 2 && (
            <span className="text-xs text-content-muted">
              Need 2+ active campaigns to analyze
            </span>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* Recommendations list */}
      {recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const product = products.find((p) => p.id === rec.product_id);
            return (
              <div
                key={rec.id}
                className="rounded-lg border border-line bg-surface-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{typeIcons[rec.type] ?? "\u{1F4A1}"}</span>
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-xs font-medium text-brand">
                        {rec.type.replace("_", " ")}
                      </span>
                      {product && (
                        <span className="text-xs text-content-muted">
                          {product.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-content">{rec.summary}</p>
                    <p className="mt-1 text-xs text-content-muted">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateRecommendation(rec.id, "accepted")}
                      className="rounded-md border border-green-500/30 px-3 py-1 text-xs text-green-400 hover:bg-green-500/10"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateRecommendation(rec.id, "dismissed")}
                      className="rounded-md border border-line px-3 py-1 text-xs text-content-muted hover:bg-surface-hover"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface-card p-8 text-center text-sm text-content-muted">
          No recommendations yet. Run an analysis on a product with active
          campaigns and performance data.
        </div>
      )}
    </div>
  );
}
