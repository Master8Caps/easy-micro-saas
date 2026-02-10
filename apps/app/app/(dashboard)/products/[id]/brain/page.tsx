"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { generateBrain } from "@/server/actions/brain";
import { loadBrain } from "@/server/actions/brain-load";
import { updateProductStatus } from "@/server/actions/products";
import {
  generateContentForCampaign,
  generateContentBulk,
  loadContentForCampaign,
} from "@/server/actions/content";
import { ChannelPill, TypePill } from "@/components/pills";
import { CopyButton } from "@/components/copy-button";
import { useUser } from "@/components/user-context";

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

interface BrainOutput {
  avatars: Avatar[];
  campaigns: unknown[];
  ad_campaigns?: unknown[];
  website_kit?: unknown;
  positioning_summary: string;
}

interface DbCampaign {
  id: string;
  avatar_id: string;
  angle: string;
  channel: string;
  hook: string;
  content_type: string;
  status: string;
  category: string;
}

interface ContentPiece {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: { cta_text?: string; notes?: string };
  status: string;
  archived: boolean;
  created_at: string;
}

interface WebsiteKitPiece {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  status: string;
  created_at: string;
}

export default function BrainPage() {
  const params = useParams();
  const router = useRouter();
  const { role } = useUser();
  const isAdmin = role === "admin";
  const productId = params.id as string;

  const [status, setStatus] = useState<"loading" | "generating" | "done" | "error">("loading");
  const [output, setOutput] = useState<BrainOutput | null>(null);
  const [socialCampaigns, setSocialCampaigns] = useState<DbCampaign[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<DbCampaign[]>([]);
  const [websiteKitPieces, setWebsiteKitPieces] = useState<WebsiteKitPiece[]>([]);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [wantsAds, setWantsAds] = useState(false);
  const [error, setError] = useState("");
  const [productStatus, setProductStatus] = useState<string>("active");
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Content generation state
  const [contentByCampaign, setContentByCampaign] = useState<Record<string, ContentPiece[]>>({});
  const [generatingCampaigns, setGeneratingCampaigns] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkAdGenerating, setBulkAdGenerating] = useState(false);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await loadBrain({ productId });

      if (cancelled) return;

      if (result.socialCampaigns) setSocialCampaigns(result.socialCampaigns as DbCampaign[]);
      if (result.adCampaigns) setAdCampaigns(result.adCampaigns as DbCampaign[]);
      if (result.websiteKitPieces) setWebsiteKitPieces(result.websiteKitPieces as WebsiteKitPiece[]);
      if (result.productStatus) setProductStatus(result.productStatus);
      setHasWebsite(result.hasWebsite ?? false);
      setWantsAds(result.wantsAds ?? false);

      // Load existing content for each campaign
      const allCampaigns = [
        ...((result.socialCampaigns as DbCampaign[]) ?? []),
        ...((result.adCampaigns as DbCampaign[]) ?? []),
      ];
      if (allCampaigns.length > 0 && result.contentCounts) {
        const counts = result.contentCounts as Record<string, number>;
        const campaignsWithContent = allCampaigns.filter(
          (c) => (counts[c.id] ?? 0) > 0,
        );
        const contentResults = await Promise.all(
          campaignsWithContent.map((c) => loadContentForCampaign(c.id)),
        );
        if (!cancelled) {
          const contentMap: Record<string, ContentPiece[]> = {};
          campaignsWithContent.forEach((c, i) => {
            const res = contentResults[i];
            if (res.pieces) contentMap[c.id] = res.pieces as ContentPiece[];
          });
          setContentByCampaign(contentMap);
        }
      }

      if (result.output) {
        setOutput(result.output as BrainOutput);
        setStatus("done");
        return;
      }

      // No existing results — generate
      setStatus("generating");
      const genResult = await generateBrain({ productId });

      if (cancelled) return;

      if (genResult.error) {
        setError(genResult.error);
        setStatus("error");
        return;
      }

      setOutput(genResult.output as BrainOutput);

      // Reload saved data from DB (campaigns, ad campaigns, website kit)
      const reloaded = await loadBrain({ productId });
      if (!cancelled) {
        if (reloaded.socialCampaigns) setSocialCampaigns(reloaded.socialCampaigns as DbCampaign[]);
        if (reloaded.adCampaigns) setAdCampaigns(reloaded.adCampaigns as DbCampaign[]);
        if (reloaded.websiteKitPieces) setWebsiteKitPieces(reloaded.websiteKitPieces as WebsiteKitPiece[]);
      }

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
      // Reload data from DB
      const reloaded = await loadBrain({ productId });
      if (reloaded.socialCampaigns) setSocialCampaigns(reloaded.socialCampaigns as DbCampaign[]);
      if (reloaded.adCampaigns) setAdCampaigns(reloaded.adCampaigns as DbCampaign[]);
      if (reloaded.websiteKitPieces) setWebsiteKitPieces(reloaded.websiteKitPieces as WebsiteKitPiece[]);
      setContentByCampaign({});
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

  const handleGenerateContent = useCallback(
    async (campaignId: string) => {
      setGeneratingCampaigns((prev) => new Set(prev).add(campaignId));
      const result = await generateContentForCampaign({ campaignId, productId });
      setGeneratingCampaigns((prev) => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
      if (result.pieces) {
        setContentByCampaign((prev) => ({
          ...prev,
          [campaignId]: result.pieces as ContentPiece[],
        }));
        setExpandedCampaigns((prev) => new Set(prev).add(campaignId));
      }
    },
    [productId],
  );

  const handleBulkGenerate = useCallback(async (campaigns: DbCampaign[], setLoading: (v: boolean) => void) => {
    setLoading(true);
    const ids = campaigns.map((c) => c.id);
    setGeneratingCampaigns(new Set(ids));

    const result = await generateContentBulk({ productId, campaignIds: ids });

    const newContent: Record<string, ContentPiece[]> = { ...contentByCampaign };
    for (const success of result.successes) {
      newContent[success.campaignId] = success.pieces as ContentPiece[];
    }
    setContentByCampaign(newContent);
    setExpandedCampaigns(new Set(ids));
    setGeneratingCampaigns(new Set());
    setLoading(false);
  }, [productId, contentByCampaign]);

  function toggleExpanded(campaignId: string) {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(campaignId)) next.delete(campaignId);
      else next.add(campaignId);
      return next;
    });
  }

  // ── Loading / generating / error states ────────────
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
            Analyzing your product, identifying avatars, and creating campaign angles...
          </p>
          <p className="mt-1 text-sm text-zinc-500">This usually takes 15-30 seconds.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-red-400">Generation failed</h1>
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

  // Find avatar name for a campaign
  function getAvatarName(campaign: DbCampaign): string {
    const rawCampaign = (output as BrainOutput & { campaigns: { avatar_name: string; angle: string }[] })
      .campaigns?.find(
        (rc: { angle: string }) => rc.angle === campaign.angle,
      ) as { avatar_name?: string } | undefined;
    return rawCampaign?.avatar_name ?? "";
  }

  const sortedSocial = [...socialCampaigns].sort((a, b) => a.channel.localeCompare(b.channel));
  const sortedAds = [...adCampaigns].sort((a, b) => a.channel.localeCompare(b.channel));

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
                <h1 className="font-heading text-3xl font-bold">Marketing Brain</h1>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="mt-2 text-lg text-zinc-400">{output.positioning_summary}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {isAdmin && (
                <button
                  onClick={handleToggleStatus}
                  disabled={togglingStatus}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
                >
                  {productStatus === "active" ? "Archive" : "Reactivate"}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={handleRegenerate}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  Regenerate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Avatars */}
        <section className="mb-12">
          <h2 className="text-xl font-bold">Target Avatars</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {output.avatars.map((avatar) => (
              <div key={avatar.name} className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="text-lg font-semibold">{avatar.name}</h3>
                <p className="mt-2 text-sm text-zinc-400">{avatar.description}</p>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Pain points</p>
                  <ul className="mt-2 space-y-1">
                    {avatar.pain_points.map((point) => (
                      <li key={point} className="text-sm text-zinc-300">&bull; {point}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Channels</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[...avatar.channels].sort((a, b) => a.localeCompare(b)).map((channel) => (
                      <ChannelPill key={channel} channel={channel} />
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <div className="rounded-lg bg-zinc-800/50 p-3">
                    <p className="text-xs text-zinc-500">
                      <strong className="text-zinc-400">Role:</strong> {avatar.icp_details.role}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      <strong className="text-zinc-400">Context:</strong> {avatar.icp_details.context}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      <strong className="text-zinc-400">Motivation:</strong> {avatar.icp_details.motivation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social Campaigns */}
        <section className="mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Social Campaigns</h2>
            {isAdmin && sortedSocial.length > 0 && (
              <button
                onClick={() => handleBulkGenerate(sortedSocial, setBulkGenerating)}
                disabled={bulkGenerating}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                {bulkGenerating ? "Generating..." : "Generate All Social Content"}
              </button>
            )}
          </div>
          <div className="mt-6 space-y-4">
            {sortedSocial.map((campaign) => {
              const avatarName = getAvatarName(campaign);
              const pieces = contentByCampaign[campaign.id];
              const isGenerating = generatingCampaigns.has(campaign.id);
              const isExpanded = expandedCampaigns.has(campaign.id);

              return (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  avatarName={avatarName}
                  pieces={pieces}
                  isGenerating={isGenerating}
                  isExpanded={isExpanded}
                  isAdmin={isAdmin}
                  onGenerate={() => handleGenerateContent(campaign.id)}
                  onToggleExpand={() => toggleExpanded(campaign.id)}
                />
              );
            })}
          </div>
        </section>

        {/* Ad Campaigns */}
        {(wantsAds || sortedAds.length > 0) && (
          <section className="mb-12">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Ad Campaigns</h2>
              {isAdmin && sortedAds.length > 0 && (
                <button
                  onClick={() => handleBulkGenerate(sortedAds, setBulkAdGenerating)}
                  disabled={bulkAdGenerating}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {bulkAdGenerating ? "Generating..." : "Generate All Ad Creatives"}
                </button>
              )}
            </div>
            {sortedAds.length > 0 ? (
              <div className="mt-6 space-y-4">
                {sortedAds.map((campaign) => {
                  const avatarName = getAvatarName(campaign);
                  const pieces = contentByCampaign[campaign.id];
                  const isGenerating = generatingCampaigns.has(campaign.id);
                  const isExpanded = expandedCampaigns.has(campaign.id);

                  return (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      avatarName={avatarName}
                      pieces={pieces}
                      isGenerating={isGenerating}
                      isExpanded={isExpanded}
                      isAdmin={isAdmin}
                      onGenerate={() => handleGenerateContent(campaign.id)}
                      onToggleExpand={() => toggleExpanded(campaign.id)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-zinc-700 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  No ad campaigns generated yet. Try regenerating the brain above.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Website Kit */}
        {(hasWebsite || websiteKitPieces.length > 0) && (
          <section className="mb-12">
            <h2 className="text-xl font-bold">Website Kit</h2>
            {websiteKitPieces.length > 0 ? (
              <div className="mt-6 space-y-4">
                {websiteKitPieces.map((piece) => (
                  <div key={piece.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <TypePill type={piece.type} />
                        <h3 className="mt-2 font-semibold">{piece.title}</h3>
                      </div>
                      <CopyButton text={piece.body} />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                      {piece.body}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-zinc-700 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  No website kit generated yet. Try regenerating the brain above.
                </p>
              </div>
            )}
          </section>
        )}

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

// ── Campaign Card Component ──────────────────────────
function CampaignCard({
  campaign,
  avatarName,
  pieces,
  isGenerating,
  isExpanded,
  isAdmin,
  onGenerate,
  onToggleExpand,
}: {
  campaign: DbCampaign;
  avatarName: string;
  pieces?: ContentPiece[];
  isGenerating: boolean;
  isExpanded: boolean;
  isAdmin: boolean;
  onGenerate: () => void;
  onToggleExpand: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <ChannelPill channel={campaign.channel} />
        <TypePill type={campaign.content_type} />
        {avatarName && <span className="text-xs text-zinc-500">for {avatarName}</span>}
      </div>
      <h3 className="mt-3 font-semibold">{campaign.angle}</h3>
      <p className="mt-2 text-sm italic text-zinc-300">&ldquo;{campaign.hook}&rdquo;</p>

      {/* Content generation section */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
        <div>
          {pieces && pieces.length > 0 && (
            <button
              onClick={onToggleExpand}
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
            >
              {isExpanded
                ? "Hide content"
                : `Show ${pieces.length} piece${pieces.length === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
        {isAdmin ? (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border border-indigo-300/30 border-t-indigo-300" />
                Generating...
              </span>
            ) : pieces && pieces.length > 0 ? (
              "Regenerate Content"
            ) : (
              "Generate Content"
            )}
          </button>
        ) : pieces && pieces.length > 0 ? (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Generated
          </span>
        ) : null}
      </div>

      {/* Inline content preview */}
      {isExpanded &&
        pieces?.map((piece) => (
          <div key={piece.id} className="mt-3 rounded-lg bg-zinc-800/50 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-400">{piece.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {piece.body}
                </p>
              </div>
              <CopyButton text={piece.body} />
            </div>
          </div>
        ))}
    </div>
  );
}
