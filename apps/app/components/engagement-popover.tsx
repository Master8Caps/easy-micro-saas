"use client";

import { useState, useRef, useEffect } from "react";
import { updateContentEngagement } from "@/server/actions/content";

interface EngagementData {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  loggedAt: string | null;
}

export function EngagementPopover({
  pieceId,
  initial,
}: {
  pieceId: string;
  initial: EngagementData;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [views, setViews] = useState(initial.views?.toString() ?? "");
  const [likes, setLikes] = useState(initial.likes?.toString() ?? "");
  const [comments, setComments] = useState(initial.comments?.toString() ?? "");
  const [shares, setShares] = useState(initial.shares?.toString() ?? "");
  const [data, setData] = useState(initial);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleSave() {
    setSaving(true);
    const engagement = {
      views: views ? parseInt(views, 10) : null,
      likes: likes ? parseInt(likes, 10) : null,
      comments: comments ? parseInt(comments, 10) : null,
      shares: shares ? parseInt(shares, 10) : null,
    };
    try {
      const result = await updateContentEngagement(pieceId, engagement);
      if (!result.error) {
        setData({
          ...engagement,
          loggedAt: new Date().toISOString(),
        });
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  const hasData = data.loggedAt !== null;

  const summaryParts: string[] = [];
  if (data.views) summaryParts.push(`${data.views} views`);
  if (data.likes) summaryParts.push(`${data.likes} likes`);
  if (data.comments) summaryParts.push(`${data.comments} comments`);
  if (data.shares) summaryParts.push(`${data.shares} shares`);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors ${
          hasData
            ? "text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20"
            : "text-content-muted hover:text-content-secondary hover:bg-surface-card-hover"
        }`}
        title={hasData ? summaryParts.join(" · ") : "Log engagement"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
        {hasData && summaryParts.length > 0 && (
          <span className="max-w-[120px] truncate">{summaryParts.slice(0, 2).join(" · ")}</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-2 w-56 rounded-xl border border-line bg-surface-secondary p-4 shadow-xl">
          <p className="mb-3 text-xs font-medium text-content-secondary">Log Engagement</p>
          <div className="space-y-2">
            {[
              { label: "Views", value: views, set: setViews },
              { label: "Likes", value: likes, set: setLikes },
              { label: "Comments", value: comments, set: setComments },
              { label: "Shares", value: shares, set: setShares },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center gap-2">
                <label className="w-20 text-xs text-content-muted">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="0"
                  className="flex-1 rounded-lg border border-line bg-surface-card px-2 py-1 text-xs text-content-primary focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
