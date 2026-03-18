"use client";

import { useState, useMemo, useEffect } from "react";
import { ChannelPill, TypePill, ArchivedBadge, ArchiveToggle } from "@/components/pills";
import { CopyButton } from "@/components/copy-button";
import { LifecycleAction } from "@/components/lifecycle-action";
import { DatePicker } from "@/components/date-picker";
import { RatingButtons } from "@/components/rating-buttons";
import { EngagementPopover } from "@/components/engagement-popover";
import {
  toggleContentPieceArchived,
  updateContentPiecesStatusBulk,
} from "@/server/actions/content";
import ImageGenerator from "@/components/image-generator";

interface TrackedLink {
  id: string;
  slug: string;
  click_count: number;
}

interface ContentPieceRow {
  id: string;
  product_id: string;
  campaign_id: string | null;
  type: string;
  title: string | null;
  body: string;
  metadata: { channel?: string; angle?: string; cta_text?: string; notes?: string };
  status: string;
  archived: boolean;
  posted_at: string | null;
  scheduled_for: string | null;
  created_at: string;
  products: { name: string } | null;
  campaigns: { angle: string; channel: string; category?: string } | null;
  links?: TrackedLink[];
  rating: number | null;
  engagement_views: number | null;
  engagement_likes: number | null;
  engagement_comments: number | null;
  engagement_shares: number | null;
  engagement_logged_at: string | null;
  image_url: string | null;
  image_source: "generated" | "uploaded" | null;
  image_prompt_used: string | null;
}

const typeOptions = [
  { value: "", label: "All types" },
  { value: "linkedin-post", label: "LinkedIn Post" },
  { value: "twitter-post", label: "Tweet" },
  { value: "facebook-post", label: "Facebook Post" },
  { value: "twitter-thread", label: "Thread" },
  { value: "video-script", label: "Video Script" },
  { value: "image-prompt", label: "Image Post" },
  { value: "landing-page-copy", label: "Landing Page" },
  { value: "email", label: "Email" },
  { value: "ad-copy", label: "Ad Copy" },
  { value: "email-sequence", label: "Email Sequence" },
  { value: "meta-description", label: "Meta Description" },
  { value: "tagline", label: "Tagline" },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "posted", label: "Posted" },
];

const categoryTabs = [
  { value: "", label: "All" },
  { value: "social", label: "Social" },
  { value: "email", label: "Email" },
  { value: "ad", label: "Ads" },
  { value: "website", label: "Website" },
];

function getCategory(piece: ContentPieceRow): string {
  if (piece.type === "email-sequence") return "email";
  if (!piece.campaign_id) return "website";
  return piece.campaigns?.category ?? "social";
}

export function ContentList({
  pieces: initialPieces,
  products,
}: {
  pieces: ContentPieceRow[];
  products: { id: string; name: string }[];
}) {
  const [pieces, setPieces] = useState(initialPieces);
  const [productFilter, setProductFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActing, setBulkActing] = useState(false);
  const [showBulkDatePicker, setShowBulkDatePicker] = useState(false);

  // Compute category counts (respecting all filters except category)
  const categoryCounts = useMemo(() => {
    const visible = pieces.filter((p) => {
      if (p.archived !== showArchived) return false;
      if (productFilter && p.product_id !== productFilter) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
    const counts: Record<string, number> = { "": visible.length };
    for (const p of visible) {
      const cat = getCategory(p);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [pieces, showArchived, productFilter, typeFilter, statusFilter]);

  const filtered = useMemo(
    () =>
      pieces.filter((p) => {
        if (p.archived !== showArchived) return false;
        if (productFilter && p.product_id !== productFilter) return false;
        if (typeFilter && p.type !== typeFilter) return false;
        if (statusFilter && p.status !== statusFilter) return false;
        if (categoryFilter && getCategory(p) !== categoryFilter) return false;
        return true;
      }),
    [pieces, showArchived, productFilter, typeFilter, statusFilter, categoryFilter],
  );

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [productFilter, typeFilter, statusFilter, categoryFilter, showArchived]);

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "";

  const hasActiveFilters = productFilter || typeFilter || statusFilter || showArchived;

  function clearFilters() {
    setProductFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setShowArchived(false);
  }

  function handleLifecycleChange(
    pieceId: string,
    newStatus: string,
    scheduledFor?: string | null,
    postedAt?: string | null,
  ) {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId
          ? {
              ...p,
              status: newStatus,
              scheduled_for: newStatus === "scheduled" ? (scheduledFor ?? p.scheduled_for) : newStatus === "draft" || newStatus === "approved" ? null : p.scheduled_for,
              posted_at: newStatus === "posted" ? (postedAt ?? new Date().toISOString()) : newStatus === "draft" || newStatus === "approved" || newStatus === "scheduled" ? null : p.posted_at,
            }
          : p,
      ),
    );
  }

  async function handleArchiveToggle(pieceId: string, currentArchived: boolean) {
    const result = await toggleContentPieceArchived(pieceId, !currentArchived);
    if (result.success) {
      setPieces((prev) =>
        prev.map((p) => (p.id === pieceId ? { ...p, archived: !currentArchived } : p)),
      );
    }
  }

  // ── Selection helpers ──────────────────────────────
  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredIds = useMemo(() => new Set(filtered.map((p) => p.id)), [filtered]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }

  // ── Bulk action context ────────────────────────────
  const selectedPieces = useMemo(
    () => pieces.filter((p) => selectedIds.has(p.id)),
    [pieces, selectedIds],
  );
  const hasApprovable = selectedPieces.some((p) => p.status === "draft");
  const hasSchedulable = selectedPieces.some((p) => p.status === "draft" || p.status === "approved");
  const hasPostable = selectedPieces.some((p) => p.status === "scheduled");

  async function handleBulkAction(
    action: "approved" | "scheduled" | "posted",
    scheduledFor?: string | null,
  ) {
    setBulkActing(true);
    setShowBulkDatePicker(false);

    // Only include pieces in valid source statuses
    let targetIds: string[];
    if (action === "approved") {
      targetIds = selectedPieces.filter((p) => p.status === "draft").map((p) => p.id);
    } else if (action === "scheduled") {
      targetIds = selectedPieces.filter((p) => p.status === "draft" || p.status === "approved").map((p) => p.id);
    } else {
      targetIds = selectedPieces.filter((p) => p.status === "scheduled").map((p) => p.id);
    }

    if (targetIds.length === 0) {
      setBulkActing(false);
      return;
    }

    // Optimistic update
    const now = new Date().toISOString();
    setPieces((prev) =>
      prev.map((p) => {
        if (!targetIds.includes(p.id)) return p;
        return {
          ...p,
          status: action,
          scheduled_for: action === "scheduled" ? (scheduledFor ?? null) : action === "approved" ? null : p.scheduled_for,
          posted_at: action === "posted" ? now : action === "approved" || action === "scheduled" ? null : p.posted_at,
        };
      }),
    );
    setSelectedIds(new Set());

    const result = await updateContentPiecesStatusBulk(targetIds, action, scheduledFor);

    if (result.error) {
      // Rollback — re-fetch would be more robust but for now just revert state
      setPieces(initialPieces);
    }

    setBulkActing(false);
  }

  return (
    <>
      {/* Row 1: Category tabs + count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-line bg-surface-card p-1">
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategoryFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === tab.value
                  ? "bg-brand text-white"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              {tab.label}
              {(categoryCounts[tab.value] ?? 0) > 0 && (
                <span className={`ml-1.5 ${categoryFilter === tab.value ? "text-white/60" : "text-content-muted"}`}>
                  {categoryCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="text-sm text-content-muted">
          {filtered.length} piece{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Row 2: Secondary filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Select all checkbox */}
        <button
          onClick={toggleSelectAll}
          title={allFilteredSelected ? "Deselect all" : "Select all visible"}
          className={`flex h-[38px] items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${
            allFilteredSelected
              ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
              : "border-line text-content-muted hover:text-content-secondary"
          }`}
        >
          <span className={`flex h-4 w-4 items-center justify-center rounded border ${
            allFilteredSelected
              ? "border-indigo-400 bg-indigo-500"
              : selectedIds.size > 0
                ? "border-indigo-400 bg-indigo-500/50"
                : "border-line"
          }`}>
            {(allFilteredSelected || selectedIds.size > 0) && (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {allFilteredSelected ? (
                  <path d="M20 6 9 17l-5-5" />
                ) : (
                  <path d="M5 12h14" />
                )}
              </svg>
            )}
          </span>
          <span className="hidden sm:inline">Select all</span>
        </button>

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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-line bg-surface-secondary px-3 py-2 text-sm text-content-secondary focus:border-indigo-500/50 focus:outline-none [&>option]:bg-surface-secondary [&>option]:text-content-secondary"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-line bg-surface-secondary px-3 py-2 text-sm text-content-secondary focus:border-indigo-500/50 focus:outline-none [&>option]:bg-surface-secondary [&>option]:text-content-secondary"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowArchived(!showArchived)}
          title={showArchived ? "View active content" : "View archived"}
          className={`rounded-lg border p-2 transition-colors ${
            showArchived
              ? "border-line bg-surface-card-hover text-content-secondary"
              : "border-line text-content-muted hover:text-content-secondary"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-content-muted transition-colors hover:text-content-secondary"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content list */}
      <div className="space-y-4">
        {filtered.map((piece) => {
          const isExpanded = expandedId === piece.id;
          const isSelected = selectedIds.has(piece.id);

          return (
            <div
              key={piece.id}
              className={`flex gap-4 rounded-xl border p-6 transition-all ${
                isSelected
                  ? "border-indigo-500/30 bg-indigo-500/[0.04]"
                  : "border-line bg-surface-card"
              } ${piece.status === "posted" ? "opacity-60" : ""}`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleSelected(piece.id)}
                className="mt-1 shrink-0"
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? "border-indigo-400 bg-indigo-500"
                    : "border-line hover:border-zinc-400"
                }`}>
                  {isSelected && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
              </button>

              {/* Card content */}
              <div className="min-w-0 flex-1">
                {/* Product name at top */}
                {piece.products && (
                  <p className="mb-2 text-sm font-medium text-content-secondary">
                    {piece.products.name}
                  </p>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {piece.campaigns && (
                        <ChannelPill channel={piece.campaigns.channel} />
                      )}
                      <TypePill type={piece.type} />
                    </div>
                    {piece.title && (
                      <h3 className="mt-2 font-semibold">{piece.title}</h3>
                    )}
                    {piece.campaigns?.angle && (
                      <p className="mt-1 text-xs text-content-muted">
                        {piece.campaigns.angle}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
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
                    <CopyButton text={piece.body} />
                    <LifecycleAction
                      pieceId={piece.id}
                      status={piece.status}
                      scheduledFor={piece.scheduled_for}
                      postedAt={piece.posted_at}
                      onStatusChange={(s, sf, pa) => handleLifecycleChange(piece.id, s, sf, pa)}
                    />
                    {piece.archived && <ArchivedBadge />}
                    <ArchiveToggle
                      archived={piece.archived}
                      onToggle={() => handleArchiveToggle(piece.id, piece.archived)}
                    />
                  </div>
                </div>

                {/* Tracked link */}
                {piece.links && piece.links.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 rounded-md bg-surface-card px-3 py-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-indigo-400">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-indigo-400">
                      {baseUrl}/r/{piece.links[0].slug}
                    </span>
                    <span className="shrink-0 text-xs text-content-muted">
                      {piece.links[0].click_count} click{piece.links[0].click_count === 1 ? "" : "s"}
                    </span>
                    <CopyButton text={`${baseUrl}/r/${piece.links[0].slug}`} />
                  </div>
                )}

                {/* Image thumbnail (when collapsed and has image) */}
                {!isExpanded && piece.image_url && (
                  <div className="mt-2">
                    <img
                      src={piece.image_url}
                      alt=""
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  </div>
                )}

                {/* Body preview / expand */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : piece.id)}
                  className="mt-3 w-full text-left"
                >
                  <p
                    className={`whitespace-pre-wrap text-sm leading-relaxed text-content-secondary ${
                      isExpanded ? "" : "line-clamp-3"
                    }`}
                  >
                    {piece.body}
                  </p>
                  {!isExpanded && piece.body.length > 200 && (
                    <span className="mt-1 inline-block text-xs text-content-muted">
                      Click to expand...
                    </span>
                  )}
                </button>

                {/* Image generator (when expanded, for image-prompt type) */}
                {isExpanded && piece.type === "image-prompt" && (
                  <ImageGenerator
                    contentPieceId={piece.id}
                    imageUrl={piece.image_url}
                    imageSource={piece.image_source}
                    imagePromptUsed={piece.image_prompt_used}
                    body={piece.body}
                    channel={piece.metadata?.channel}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-secondary px-5 py-3 shadow-2xl">
            <span className="text-sm font-medium text-content-secondary">
              {selectedIds.size} selected
            </span>

            <div className="h-4 w-px bg-surface-card-hover" />

            {hasApprovable && (
              <button
                onClick={() => handleBulkAction("approved")}
                disabled={bulkActing}
                className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
              >
                {bulkActing ? "..." : "Approve"}
              </button>
            )}

            {hasSchedulable && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkDatePicker(!showBulkDatePicker)}
                  disabled={bulkActing}
                  className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
                >
                  {bulkActing ? "..." : "Schedule"}
                </button>
                {showBulkDatePicker && (
                  <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2">
                    <DatePicker
                      onChange={(date) => handleBulkAction("scheduled", date)}
                      onClose={() => setShowBulkDatePicker(false)}
                    />
                  </div>
                )}
              </div>
            )}

            {hasPostable && (
              <button
                onClick={() => handleBulkAction("posted")}
                disabled={bulkActing}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
              >
                {bulkActing ? "..." : "Mark Posted"}
              </button>
            )}

            <div className="h-4 w-px bg-surface-card-hover" />

            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-md p-1 text-content-muted transition-colors hover:text-content-secondary"
              title="Clear selection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
