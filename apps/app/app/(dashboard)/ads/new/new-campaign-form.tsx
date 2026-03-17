"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdCampaign } from "@/server/actions/ad-campaigns";
import { generateAdPackage } from "@/server/actions/ad-generation";
import type { Platform, AdObjective } from "@/lib/adapters/types";

interface Product {
  id: string;
  name: string;
  description: string;
}

const platforms: { value: Platform; label: string }[] = [
  { value: "meta", label: "Meta (Facebook & Instagram)" },
  { value: "google", label: "Google Ads" },
  { value: "linkedin", label: "LinkedIn Ads" },
  { value: "tiktok", label: "TikTok Ads" },
];

const objectives: { value: AdObjective; label: string; description: string }[] =
  [
    {
      value: "awareness",
      label: "Awareness",
      description: "Get your brand in front of people",
    },
    {
      value: "traffic",
      label: "Traffic",
      description: "Drive visitors to your site",
    },
    {
      value: "conversions",
      label: "Conversions",
      description: "Get signups, purchases, etc.",
    },
    {
      value: "engagement",
      label: "Engagement",
      description: "Likes, comments, and shares",
    },
    {
      value: "leads",
      label: "Leads",
      description: "Collect contact info",
    },
  ];

export function NewCampaignForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [platform, setPlatform] = useState<Platform>("meta");
  const [objective, setObjective] = useState<AdObjective>("traffic");
  const [name, setName] = useState("");
  const [dailyBudget, setDailyBudget] = useState(25);
  const [totalBudget, setTotalBudget] = useState(0);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // Generated packages
  const [packages, setPackages] = useState<
    Array<{
      headline: string;
      body: string;
      cta: string;
      budgetRecommendation: string;
      audienceSummary: string;
      deploymentSteps: string[];
      targetingNotes: string;
      imagePrompt: string;
    }>
  | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    // First create the campaign
    const campaignResult = await createAdCampaign({
      productId,
      platform,
      name,
      objective,
      dailyBudget,
      totalBudget,
      audienceTargeting: {},
    });

    if (campaignResult.error) {
      setError(campaignResult.error);
      setLoading(false);
      return;
    }

    // Then generate ad packages
    const genResult = await generateAdPackage({
      productId,
      platform,
      objective,
      campaignName: name,
      dailyBudget,
      destinationUrl,
      additionalContext: additionalContext || undefined,
    });

    if (genResult.error) {
      setError(genResult.error);
      setLoading(false);
      return;
    }

    setPackages(genResult.packages ?? null);
    setLoading(false);
    setStep(3);
  }

  return (
    <div className="mt-6">
      {error && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-content">
              Product
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-content"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-content">
              Campaign Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Launch — Awareness"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-content">
              Platform
            </label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    platform === p.value
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-line text-content-muted hover:border-brand/30"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-content">
              Objective
            </label>
            <div className="space-y-2">
              {objectives.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setObjective(o.value)}
                  className={`block w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    objective === o.value
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-line text-content-muted hover:border-brand/30"
                  }`}
                >
                  <span className="font-medium">{o.label}</span>
                  <span className="ml-2 text-xs opacity-70">
                    {o.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!name || !productId}
            className="mt-4 rounded-md bg-brand px-6 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Budget & Destination */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-content">
              Daily Budget ($)
            </label>
            <input
              type="number"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(Number(e.target.value))}
              min={1}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-content"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-content">
              Total Budget ($)
              <span className="ml-1 text-xs text-content-muted">
                optional — 0 = no limit
              </span>
            </label>
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              min={0}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-content"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-content">
              Destination URL
            </label>
            <input
              type="url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://yoursite.com/landing"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-content">
              Additional Context
              <span className="ml-1 text-xs text-content-muted">
                optional — any extra info for the AI
              </span>
            </label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
              placeholder="e.g., Focus on pain point X, use casual tone, target developers..."
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-md border border-line px-4 py-2 text-sm text-content-muted hover:bg-surface-hover"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !destinationUrl}
              className="rounded-md bg-brand px-6 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {loading ? "Generating ads..." : "Generate Ad Packages"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generated Packages */}
      {step === 3 && packages && (
        <div className="space-y-4">
          <p className="text-sm text-content-muted">
            Here are 3 ad variations. Copy the one you like best and deploy it.
          </p>
          {packages.map((pkg, i) => (
            <div
              key={i}
              className="rounded-lg border border-line bg-surface-card p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-content">
                  Variation {i + 1}
                </h3>
                <button
                  onClick={() => {
                    const text = `Headline: ${pkg.headline}\n\nBody: ${pkg.body}\n\nCTA: ${pkg.cta}`;
                    navigator.clipboard.writeText(text);
                  }}
                  className="rounded-md border border-line px-3 py-1 text-xs text-content-muted hover:bg-surface-hover"
                >
                  Copy All
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs font-medium uppercase text-content-muted">
                    Headline
                  </span>
                  <p className="text-content">{pkg.headline}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-content-muted">
                    Body
                  </span>
                  <p className="text-content">{pkg.body}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-content-muted">
                    CTA
                  </span>
                  <p className="text-content">{pkg.cta}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-content-muted">
                    Budget
                  </span>
                  <p className="text-content">{pkg.budgetRecommendation}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase text-content-muted">
                    Audience
                  </span>
                  <p className="text-content">{pkg.audienceSummary}</p>
                </div>
              </div>

              <div className="mt-3 border-t border-line pt-3">
                <span className="text-xs font-medium uppercase text-content-muted">
                  Deploy
                </span>
                <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-content-muted">
                  {pkg.deploymentSteps.map((deployStep, j) => (
                    <li key={j}>{deployStep}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/ads")}
              className="rounded-md bg-brand px-6 py-2 text-sm font-medium text-white hover:bg-brand/90"
            >
              Done — Go to Campaigns
            </button>
            <button
              onClick={() => {
                setPackages(null);
                setStep(2);
              }}
              className="rounded-md border border-line px-4 py-2 text-sm text-content-muted hover:bg-surface-hover"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
