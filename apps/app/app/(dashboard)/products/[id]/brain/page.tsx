"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { generateBrain } from "@/server/actions/brain";
import { loadBrain } from "@/server/actions/brain-load";
import { updateProductStatus } from "@/server/actions/products";

interface Avatar {
  name: string;
  description: string;
  pain_points: string[];
  channels: string[];
  icp_details: {
    role: string;
    context: string;
    motivation: string;
  };
}

interface Campaign {
  avatar_name: string;
  angle: string;
  channel: string;
  hook: string;
  content_type: string;
  why_it_works: string;
}

interface BrainOutput {
  avatars: Avatar[];
  campaigns: Campaign[];
  positioning_summary: string;
}

// ── Channel pill colors ──────────────────────────────
const channelStyles: Record<string, string> = {
  linkedin: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "x / twitter": "border-sky-500/30 bg-sky-500/10 text-sky-400",
  "x/twitter": "border-sky-500/30 bg-sky-500/10 text-sky-400",
  twitter: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  x: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  reddit: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  "product hunt": "border-rose-500/30 bg-rose-500/10 text-rose-400",
  "indie hackers": "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  email: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  "blog / seo": "border-green-500/30 bg-green-500/10 text-green-400",
  blog: "border-green-500/30 bg-green-500/10 text-green-400",
  seo: "border-green-500/30 bg-green-500/10 text-green-400",
  "paid ads": "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

function getChannelStyle(channel: string) {
  return (
    channelStyles[channel.toLowerCase()] ??
    "border-zinc-600/30 bg-zinc-600/10 text-zinc-400"
  );
}

// ── Format content type ──────────────────────────────
function formatContentType(type: string) {
  return type
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Channel pill component ───────────────────────────
function ChannelPill({ channel }: { channel: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getChannelStyle(channel)}`}
    >
      {channel}
    </span>
  );
}

// ── Content type pill ────────────────────────────────
function TypePill({ type }: { type: string }) {
  return (
    <span className="rounded-md border border-indigo-500/20 bg-indigo-500/5 px-2 py-0.5 text-xs text-indigo-300/70">
      {formatContentType(type)}
    </span>
  );
}

export default function BrainPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [status, setStatus] = useState<"loading" | "generating" | "done" | "error">(
    "loading",
  );
  const [output, setOutput] = useState<BrainOutput | null>(null);
  const [error, setError] = useState("");
  const [productStatus, setProductStatus] = useState<string>("active");
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await loadBrain({ productId });

      if (cancelled) return;

      if (result.output) {
        setOutput(result.output as BrainOutput);
        if (result.productStatus) setProductStatus(result.productStatus);
        setStatus("done");
        return;
      }

      setStatus("generating");
      const genResult = await generateBrain({ productId });

      if (cancelled) return;

      if (genResult.error) {
        setError(genResult.error);
        setStatus("error");
        return;
      }

      setOutput(genResult.output as BrainOutput);
      setStatus("done");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleRegenerate = useCallback(async () => {
    setStatus("generating");
    setError("");
    const result = await generateBrain({ productId });
    if (result.error) {
      setError(result.error);
      setStatus("error");
    } else {
      setOutput(result.output as BrainOutput);
      setStatus("done");
    }
  }, [productId]);

  async function handleToggleStatus() {
    setTogglingStatus(true);
    const newStatus = productStatus === "active" ? "archived" : "active";
    const result = await updateProductStatus(productId, newStatus);
    if (!result.error) {
      setProductStatus(newStatus);
    }
    setTogglingStatus(false);
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (status === "generating") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
          <h1 className="mt-6 font-heading text-2xl font-bold">
            Generating your Marketing Brain
          </h1>
          <p className="mt-2 text-zinc-400">
            Analyzing your product, identifying avatars, and creating campaign
            angles...
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            This usually takes 15-30 seconds.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-red-400">
            Generation failed
          </h1>
          <p className="mt-2 text-zinc-400">{error}</p>
          <button
            onClick={handleRegenerate}
            className="mt-6 rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!output) return null;

  const statusLabel = productStatus.charAt(0).toUpperCase() + productStatus.slice(1);
  const statusStyle =
    productStatus === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : "border-zinc-600/30 bg-zinc-600/10 text-zinc-500";

  return (
    <div className="py-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            &larr; Back to Dashboard
          </button>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-3xl font-bold">
                  Marketing Brain
                </h1>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="mt-2 text-lg text-zinc-400">
                {output.positioning_summary}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
              >
                {productStatus === "active" ? "Archive" : "Reactivate"}
              </button>
              <button
                onClick={handleRegenerate}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>

        {/* Avatars */}
        <section className="mb-12">
          <h2 className="text-xl font-bold">Target Avatars</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {output.avatars.map((avatar) => (
              <div
                key={avatar.name}
                className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
              >
                <h3 className="text-lg font-semibold">{avatar.name}</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {avatar.description}
                </p>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Pain points
                  </p>
                  <ul className="mt-2 space-y-1">
                    {avatar.pain_points.map((point) => (
                      <li key={point} className="text-sm text-zinc-300">
                        &bull; {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Channels
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[...avatar.channels].sort((a, b) => a.localeCompare(b)).map((channel) => (
                      <ChannelPill key={channel} channel={channel} />
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <div className="rounded-lg bg-zinc-800/50 p-3">
                    <p className="text-xs text-zinc-500">
                      <strong className="text-zinc-400">Role:</strong>{" "}
                      {avatar.icp_details.role}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      <strong className="text-zinc-400">Context:</strong>{" "}
                      {avatar.icp_details.context}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      <strong className="text-zinc-400">Motivation:</strong>{" "}
                      {avatar.icp_details.motivation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Campaigns */}
        <section className="mb-12">
          <h2 className="text-xl font-bold">Campaign Angles</h2>
          <div className="mt-6 space-y-4">
            {[...output.campaigns].sort((a, b) => a.channel.localeCompare(b.channel)).map((campaign, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ChannelPill channel={campaign.channel} />
                  <TypePill type={campaign.content_type} />
                  <span className="text-xs text-zinc-500">
                    for {campaign.avatar_name}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold">{campaign.angle}</h3>
                <p className="mt-2 text-sm italic text-zinc-300">
                  &ldquo;{campaign.hook}&rdquo;
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  {campaign.why_it_works}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
