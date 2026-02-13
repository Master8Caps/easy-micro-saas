"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/server/actions/products";

const channelGroups = [
  {
    label: "Social Media",
    channels: ["LinkedIn", "X / Twitter", "Facebook", "Instagram", "TikTok", "YouTube", "Pinterest"],
  },
  {
    label: "Communities",
    channels: ["Reddit", "Product Hunt", "Indie Hackers"],
  },
  {
    label: "Content & Outreach",
    channels: ["Email", "Blog / SEO"],
  },
];

const adPlatformOptions = ["Meta", "Google", "TikTok", "LinkedIn Ads"];

const TOTAL_STEPS = 4;

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [market, setMarket] = useState("");
  const [goals, setGoals] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [wantsAds, setWantsAds] = useState(false);
  const [adPlatforms, setAdPlatforms] = useState<string[]>([]);
  const [contentFormats, setContentFormats] = useState<string[]>(["text", "images", "video"]);

  function toggleChannel(channel: string) {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  }

  function toggleAdPlatform(platform: string) {
    setAdPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  }

  function toggleContentFormat(format: string) {
    setContentFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format],
    );
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const result = await createProduct({
      name,
      description,
      market,
      goals,
      channels,
      has_website: hasWebsite,
      website_url: hasWebsite ? websiteUrl : "",
      wants_ads: wantsAds,
      ad_platforms: wantsAds ? adPlatforms : [],
      content_formats: contentFormats,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/products/${result.id}/brain`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">
            Step {step} of {TOTAL_STEPS}
          </p>
          <div className="mt-2 flex gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  s <= step ? "bg-white" : "bg-white/[0.06]"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <h1 className="font-heading text-2xl font-bold">
              What are you building?
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Tell us about your product. Be specific — better input means
              better output.
            </p>

            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Product name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. InvoiceBot"
                  className="mt-1 block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  One-line description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Automated invoicing for freelancers"
                  className="mt-1 block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Target market / problem being solved
                </label>
                <textarea
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  rows={3}
                  placeholder="e.g. Freelance designers and developers who waste hours every month creating and following up on invoices. They need something that handles it automatically."
                  className="mt-1 block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!name || !description || !market}
              className="mt-8 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-heading text-2xl font-bold">
              What are your goals?
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              What does success look like in the next 30 days?
            </p>

            <div className="mt-8">
              <label className="block text-sm font-medium text-zinc-300">
                Goals
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={4}
                placeholder="e.g. Get 50 signups from freelancers, validate that automated invoice reminders are the killer feature, figure out if LinkedIn or Twitter is the better channel."
                className="mt-1 block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05]"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!goals}
                className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-heading text-2xl font-bold">
              Where do you want to reach people?
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Pick the channels you want to post on. Select at least one.
            </p>

            <div className="mt-8 space-y-5">
              {channelGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.channels.map((channel) => (
                      <button
                        key={channel}
                        onClick={() => toggleChannel(channel)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                          channels.includes(channel)
                            ? "border-white bg-white/10 text-zinc-100"
                            : "border-white/[0.06] text-zinc-400 hover:border-white/[0.1] hover:text-zinc-300"
                        }`}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05]"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={channels.length === 0}
                className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="font-heading text-2xl font-bold">
              A couple more things...
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              This helps us tailor your marketing brain to your situation.
            </p>

            <div className="mt-8 space-y-6">
              {/* Content formats */}
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  What content formats do you want to create?
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Unselect any formats you don&apos;t plan to create.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    { value: "text", label: "Text", desc: "Posts & threads" },
                    { value: "images", label: "Images", desc: "AI image concepts" },
                    { value: "video", label: "Video", desc: "Short-form scripts" },
                  ].map((format) => {
                    const selected = contentFormats.includes(format.value);
                    return (
                      <button
                        key={format.value}
                        onClick={() => toggleContentFormat(format.value)}
                        className={`relative rounded-xl border p-4 text-left transition-colors ${
                          selected
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-white/[0.06] text-zinc-400 hover:border-white/[0.1]"
                        }`}
                      >
                        {selected && (
                          <svg
                            className="absolute top-3 right-3 h-5 w-5 text-emerald-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <p className={`text-sm font-medium ${selected ? "text-zinc-100" : ""}`}>
                          {format.label}
                        </p>
                        <p className={`mt-0.5 text-xs ${selected ? "text-zinc-400" : "text-zinc-500"}`}>
                          {format.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Website toggle */}
              <div className="rounded-xl border border-white/[0.06] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Do you have a website?
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      We&apos;ll generate landing page copy, meta descriptions,
                      and email sequences.
                    </p>
                  </div>
                  <button
                    onClick={() => setHasWebsite(!hasWebsite)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      hasWebsite ? "bg-white" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${
                        hasWebsite
                          ? "translate-x-5 bg-zinc-950"
                          : "bg-zinc-400"
                      }`}
                    />
                  </button>
                </div>
                {hasWebsite && (
                  <div className="mt-4">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourproduct.com"
                      className="block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
                )}
              </div>

              {/* Ads toggle */}
              <div className="rounded-xl border border-white/[0.06] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Do you want to run paid ads?
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      We&apos;ll generate ad creatives and copy for your chosen
                      platforms.
                    </p>
                  </div>
                  <button
                    onClick={() => setWantsAds(!wantsAds)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      wantsAds ? "bg-white" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${
                        wantsAds
                          ? "translate-x-5 bg-zinc-950"
                          : "bg-zinc-400"
                      }`}
                    />
                  </button>
                </div>
                {wantsAds && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {adPlatformOptions.map((platform) => (
                      <button
                        key={platform}
                        onClick={() => toggleAdPlatform(platform)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                          adPlatforms.includes(platform)
                            ? "border-white bg-white/10 text-zinc-100"
                            : "border-white/[0.06] text-zinc-400 hover:border-white/[0.1] hover:text-zinc-300"
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="rounded-lg border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.05]"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || contentFormats.length === 0}
                className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-30"
              >
                {loading ? "Creating..." : "Generate Marketing Brain"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
