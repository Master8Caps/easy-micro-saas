"use client";

import { useState, useMemo } from "react";
import { ChannelPill, TypePill, ArchivedBadge, ArchiveToggle } from "@/components/pills";
import { CopyButton } from "@/components/copy-button";
import { LifecycleAction } from "@/components/lifecycle-action";
import { toggleContentPieceArchived } from "@/server/actions/content";

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

  const filtered = pieces.filter((p) => {
    if (p.archived !== showArchived) return false;
    if (productFilter && p.product_id !== productFilter) return false;
    if (typeFilter && p.type !== typeFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (categoryFilter && getCategory(p) !== categoryFilter) return false;
    return true;
  });

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

  return (
    <>
      {/* Row 1: Category tabs + count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategoryFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === tab.value
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
              {(categoryCounts[tab.value] ?? 0) > 0 && (
                <span className={`ml-1.5 ${categoryFilter === tab.value ? "text-zinc-500" : "text-zinc-600"}`}>
                  {categoryCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="text-sm text-zinc-500">
          {filtered.length} piece{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Row 2: Secondary filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="rounded-lg border border-white/[0.06] bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-zinc-300"
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
          className="rounded-lg border border-white/[0.06] bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-zinc-300"
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
          className="rounded-lg border border-white/[0.06] bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none [&>option]:bg-zinc-900 [&>option]:text-zinc-300"
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
              ? "border-white/[0.1] bg-white/[0.05] text-zinc-300"
              : "border-white/[0.06] text-zinc-500 hover:text-zinc-300"
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
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content list */}
      <div className="space-y-4">
        {filtered.map((piece) => {
          const isExpanded = expandedId === piece.id;

          return (
            <div
              key={piece.id}
              className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-opacity ${
                piece.status === "posted" ? "opacity-60" : ""
              }`}
            >
              {/* Product name at top */}
              {piece.products && (
                <p className="mb-2 text-sm font-medium text-zinc-400">
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
                    <p className="mt-1 text-xs text-zinc-500">
                      {piece.campaigns.angle}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
                <div className="mt-2 flex items-center gap-2 rounded-md bg-white/[0.03] px-3 py-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-indigo-400">
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

              {/* Body preview / expand */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : piece.id)}
                className="mt-3 w-full text-left"
              >
                <p
                  className={`whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 ${
                    isExpanded ? "" : "line-clamp-3"
                  }`}
                >
                  {piece.body}
                </p>
                {!isExpanded && piece.body.length > 200 && (
                  <span className="mt-1 inline-block text-xs text-zinc-500">
                    Click to expand...
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
