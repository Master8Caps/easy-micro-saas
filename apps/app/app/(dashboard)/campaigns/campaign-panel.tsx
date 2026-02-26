"use client";

import { useState, useEffect, useCallback } from "react";
import { ChannelPill, TypePill, ArchivedBadge, ArchiveToggle } from "@/components/pills";
import { CopyButton } from "@/components/copy-button";
import { LifecycleAction } from "@/components/lifecycle-action";
import { RatingButtons } from "@/components/rating-buttons";
import { EngagementPopover } from "@/components/engagement-popover";
import {
  generateContentForCampaign,
  loadContentForCampaign,
  toggleContentPieceArchived,
} from "@/server/actions/content";
import { updateCampaignDestinationUrl } from "@/server/actions/links";

interface TrackedLink {
  id: string;
  slug: string;
  click_count: number;
}

interface ContentPiece {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: { cta_text?: string; notes?: string };
  status: string;
  archived: boolean;
  posted_at: string | null;
  scheduled_for: string | null;
  created_at: string;
  links?: TrackedLink[];
  rating: number | null;
  engagement_views: number | null;
  engagement_likes: number | null;
  engagement_comments: number | null;
  engagement_shares: number | null;
  engagement_logged_at: string | null;
}

interface CampaignPanelProps {
  campaign: {
    id: string;
    product_id: string;
    angle: string;
    channel: string;
    hook: string;
    content_type: string;
    status: string;
    destination_url?: string | null;
    products: { name: string } | null;
    avatars: { name: string } | null;
  };
  onClose: () => void;
}

export function CampaignPanel({ campaign, onClose }: CampaignPanelProps) {
  const [pieces, setPieces] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(null);
  const [destUrl, setDestUrl] = useState(campaign.destination_url ?? "");
  const [editingUrl, setEditingUrl] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "";

  const handleSaveUrl = useCallback(async () => {
    setSavingUrl(true);
    const result = await updateCampaignDestinationUrl(campaign.id, destUrl);
    if (result.success) setEditingUrl(false);
    setSavingUrl(false);
  }, [campaign.id, destUrl]);

  useEffect(() => {
    async function load() {
      const result = await loadContentForCampaign(campaign.id);
      if (result.pieces) setPieces(result.pieces as ContentPiece[]);
      setLoading(false);
    }
    load();
  }, [campaign.id]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    const result = await generateContentForCampaign({
      campaignId: campaign.id,
      productId: campaign.product_id,
    });
    if (result.pieces) {
      setPieces(result.pieces as ContentPiece[]);
    }
    setGenerating(false);
  }, [campaign.id, campaign.product_id]);

  async function handleArchiveToggle(pieceId: string, currentArchived: boolean) {
    const result = await toggleContentPieceArchived(pieceId, !currentArchived);
    if (result.success) {
      setPieces((prev) =>
        prev.map((p) => (p.id === pieceId ? { ...p, archived: !currentArchived } : p)),
      );
    }
  }

  const hasContent = pieces.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-white/[0.06] bg-zinc-950 shadow-2xl">
        {/* Panel header */}
        <div className="flex items-start justify-between border-b border-white/[0.06] p-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ChannelPill channel={campaign.channel} />
              <TypePill type={campaign.content_type} />
              {campaign.avatars && (
                <span className="text-xs text-zinc-500">
                  for {campaign.avatars.name}
                </span>
              )}
            </div>
            {campaign.products && (
              <p className="mt-2 text-sm font-medium text-zinc-400">
                {campaign.products.name}
              </p>
            )}
            <h2 className="mt-2 text-lg font-semibold">{campaign.angle}</h2>
            <p className="mt-1 text-sm italic text-zinc-400">
              &ldquo;{campaign.hook}&rdquo;
            </p>

            {/* Destination URL */}
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              <p className="mb-1 text-xs font-medium text-zinc-500">Destination URL</p>
              {editingUrl ? (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={destUrl}
                    onChange={(e) => setDestUrl(e.target.value)}
                    placeholder="https://yoursite.com/page"
                    className="flex-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveUrl}
                    disabled={savingUrl}
                    className="rounded-md bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/30 disabled:opacity-50"
                  >
                    {savingUrl ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditingUrl(false); setDestUrl(campaign.destination_url ?? ""); }}
                    className="rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {destUrl ? (
                    <span className="truncate rounded-md bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-indigo-400">{destUrl}</span>
                  ) : (
                    <span className="text-sm text-zinc-600">Not set (uses product URL)</span>
                  )}
                  <button
                    onClick={() => setEditingUrl(true)}
                    className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-zinc-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Panel body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Generate / status section */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">
              Content Pieces
            </h3>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-indigo-300/30 border-t-indigo-300" />
                  Generating...
                </span>
              ) : hasContent ? (
                "Regenerate Content"
              ) : (
                "Generate Content"
              )}
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
            </div>
          )}

          {/* Empty state */}
          {!loading && !hasContent && (
            <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
              <p className="text-sm text-zinc-500">
                No content generated yet. Click the button above to generate.
              </p>
            </div>
          )}

          {/* Content pieces */}
          {!loading && hasContent && (
            <div className="space-y-3">
              {pieces.map((piece) => {
                const isExpanded = expandedPieceId === piece.id;

                return (
                  <div
                    key={piece.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02]"
                  >
                    {/* Compact header — always visible */}
                    <button
                      onClick={() =>
                        setExpandedPieceId(isExpanded ? null : piece.id)
                      }
                      className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`shrink-0 text-zinc-500 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <TypePill type={piece.type} />
                        <span className="truncate text-sm font-medium text-zinc-300">
                          {piece.title ?? "Untitled"}
                        </span>
                      </div>
                      <div
                        className="flex shrink-0 items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RatingButtons pieceId={piece.id} initialRating={piece.rating} />
                        {piece.status === "posted" && (
                          <EngagementPopover
                            pieceId={piece.id}
                            initial={{
                              views: piece.engagement_views,
                              likes: piece.engagement_likes,
                              comments: piece.engagement_comments,
                              shares: piece.engagement_shares,
                              loggedAt: piece.engagement_logged_at,
                            }}
                          />
                        )}
                        <LifecycleAction
                          pieceId={piece.id}
                          status={piece.status}
                          scheduledFor={piece.scheduled_for}
                          postedAt={piece.posted_at}
                        />
                        {piece.archived && <ArchivedBadge />}
                        <ArchiveToggle
                          archived={piece.archived}
                          onToggle={() => handleArchiveToggle(piece.id, piece.archived)}
                        />
                      </div>
                    </button>

                    {/* Expanded body */}
                    {isExpanded && (
                      <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
                        {/* Tracked link */}
                        {piece.links && piece.links.length > 0 && (
                          <div className="mb-3 flex items-center gap-2 rounded-md bg-white/[0.03] px-3 py-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-indigo-400">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <span className="min-w-0 flex-1 truncate font-mono text-xs text-indigo-400">
                              {baseUrl}/r/{piece.links[0].slug}
                            </span>
                            <span className="shrink-0 text-xs text-zinc-500">
                              {piece.links[0].click_count} click{piece.links[0].click_count === 1 ? "" : "s"}
                            </span>
                            <CopyButton text={`${baseUrl}/r/${piece.links[0].slug}`} />
                          </div>
                        )}
                        <div className="flex justify-end mb-2">
                          <CopyButton text={piece.body} />
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                          {piece.body}
                        </p>
                        {piece.metadata?.notes && (
                          <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-zinc-500">
                            <strong className="text-zinc-400">Notes:</strong>{" "}
                            {piece.metadata.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
