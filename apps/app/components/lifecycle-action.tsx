"use client";

import { useState } from "react";
import { DatePicker } from "./date-picker";
import { updateContentPieceStatus } from "@/server/actions/content";

type LifecycleStatus = "draft" | "approved" | "scheduled" | "posted";

const statusConfig: Record<LifecycleStatus, { label: string; style: string }> = {
  draft: {
    label: "Draft",
    style: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  approved: {
    label: "Approved",
    style: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  scheduled: {
    label: "Scheduled",
    style: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  },
  posted: {
    label: "Posted",
    style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LifecycleAction({
  pieceId,
  status: initialStatus,
  scheduledFor: initialScheduledFor,
  postedAt: initialPostedAt,
  onStatusChange,
}: {
  pieceId: string;
  status: string;
  scheduledFor?: string | null;
  postedAt?: string | null;
  onStatusChange?: (newStatus: string, scheduledFor?: string | null, postedAt?: string | null) => void;
}) {
  const [status, setStatus] = useState<LifecycleStatus>(
    (initialStatus as LifecycleStatus) || "draft",
  );
  const [scheduledFor, setScheduledFor] = useState(initialScheduledFor ?? null);
  const [postedAt, setPostedAt] = useState(initialPostedAt ?? null);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRevert, setShowRevert] = useState(false);

  const config = statusConfig[status] ?? statusConfig.draft;

  async function transition(
    newStatus: LifecycleStatus,
    newScheduledFor?: string | null,
  ) {
    setSaving(true);
    const prevStatus = status;
    const prevScheduledFor = scheduledFor;
    const prevPostedAt = postedAt;

    // Optimistic update
    setStatus(newStatus);
    if (newStatus === "posted") {
      setPostedAt(new Date().toISOString());
    } else if (newStatus === "draft" || newStatus === "approved") {
      setPostedAt(null);
      setScheduledFor(null);
    } else if (newStatus === "scheduled" && newScheduledFor) {
      setScheduledFor(newScheduledFor);
      setPostedAt(null);
    }

    const result = await updateContentPieceStatus(
      pieceId,
      newStatus,
      newScheduledFor,
    );

    if (!result.success) {
      // Rollback
      setStatus(prevStatus);
      setScheduledFor(prevScheduledFor);
      setPostedAt(prevPostedAt);
    } else {
      // Notify parent
      onStatusChange?.(
        newStatus,
        newStatus === "scheduled" ? newScheduledFor : null,
        newStatus === "posted" ? new Date().toISOString() : null,
      );
    }
    setSaving(false);
    setShowRevert(false);
  }

  function handleScheduleDate(date: string) {
    setShowDatePicker(false);
    transition("scheduled", date);
  }

  return (
    <div
      className="relative flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Status badge */}
      <button
        onClick={() => setShowRevert(!showRevert)}
        disabled={saving}
        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${config.style}`}
        title={status === "draft" ? "Draft" : "Click to change status"}
      >
        {config.label}
        {status === "scheduled" && scheduledFor && (
          <span className="ml-1 opacity-70">· {formatDate(scheduledFor)}</span>
        )}
        {status === "posted" && postedAt && (
          <span className="ml-1 opacity-70">· {formatDate(postedAt)}</span>
        )}
      </button>

      {/* Next-action button */}
      {status === "draft" && (
        <button
          onClick={() => transition("approved")}
          disabled={saving}
          className="rounded-full border border-blue-500/20 bg-blue-500/5 px-2.5 py-0.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/15 disabled:opacity-50"
        >
          Approve
        </button>
      )}

      {status === "approved" && (
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          disabled={saving}
          className="rounded-full border border-violet-500/20 bg-violet-500/5 px-2.5 py-0.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/15 disabled:opacity-50"
        >
          Schedule
        </button>
      )}

      {status === "scheduled" && (
        <button
          onClick={() => transition("posted")}
          disabled={saving}
          className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/15 disabled:opacity-50"
        >
          Mark Posted
        </button>
      )}

      {/* Revert dropdown */}
      {showRevert && status !== "draft" && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-white/[0.08] bg-zinc-900 py-1 shadow-xl">
          {status === "approved" && (
            <button
              onClick={() => transition("draft")}
              className="block w-full px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
            >
              Back to Draft
            </button>
          )}
          {status === "scheduled" && (
            <>
              <button
                onClick={() => setShowDatePicker(true)}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
              >
                Change date
              </button>
              <button
                onClick={() => transition("approved")}
                className="block w-full px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
              >
                Unschedule
              </button>
            </>
          )}
          {status === "posted" && (
            <button
              onClick={() =>
                scheduledFor
                  ? transition("scheduled", scheduledFor)
                  : transition("approved")
              }
              className="block w-full px-3 py-1.5 text-left text-xs text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
            >
              Undo post
            </button>
          )}
        </div>
      )}

      {/* Date picker popover */}
      {showDatePicker && (
        <div className="absolute left-0 top-full z-50 mt-1">
          <DatePicker
            value={scheduledFor}
            onChange={handleScheduleDate}
            onClose={() => setShowDatePicker(false)}
          />
        </div>
      )}
    </div>
  );
}
