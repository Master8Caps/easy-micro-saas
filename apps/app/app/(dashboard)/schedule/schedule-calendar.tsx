"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChannelPill, TypePill } from "@/components/pills";
import { CopyButton } from "@/components/copy-button";
import { LifecycleAction } from "@/components/lifecycle-action";
import { RatingButtons } from "@/components/rating-buttons";
import { EngagementPopover } from "@/components/engagement-popover";
import { updateContentPieceSchedule } from "@/server/actions/content";

interface SchedulePiece {
  id: string;
  product_id: string;
  campaign_id: string | null;
  type: string;
  title: string | null;
  body: string;
  status: string;
  posted_at: string | null;
  scheduled_for: string | null;
  archived: boolean;
  rating: number | null;
  engagement_views: number | null;
  engagement_likes: number | null;
  engagement_comments: number | null;
  engagement_shares: number | null;
  engagement_logged_at: string | null;
  products: { name: string } | null;
  campaigns: { channel: string; angle: string } | null;
}

function getWeekDays(offset: number) {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + offset * 7);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({
      date: date.toISOString().split("T")[0],
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayOfMonth: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return days;
}

function getWeekLabel(days: { date: string; dayOfMonth: number; month: string }[]) {
  const first = days[0];
  const last = days[6];
  const startDate = new Date(first.date);
  const endDate = new Date(last.date);

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${first.dayOfMonth} — ${last.dayOfMonth} ${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  }
  return `${first.dayOfMonth} ${first.month} — ${last.dayOfMonth} ${last.month} ${endDate.getFullYear()}`;
}

export function ScheduleCalendar({
  scheduledPieces: initialScheduled,
  unscheduledPieces: initialUnscheduled,
  products,
  weekOffset,
}: {
  scheduledPieces: SchedulePiece[];
  unscheduledPieces: SchedulePiece[];
  products: { id: string; name: string }[];
  weekOffset: number;
}) {
  const router = useRouter();
  const [scheduled, setScheduled] = useState(initialScheduled);
  const [unscheduled, setUnscheduled] = useState(initialUnscheduled);
  const [productFilter, setProductFilter] = useState("");
  const [selectedPiece, setSelectedPiece] = useState<SchedulePiece | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const todayStr = new Date().toISOString().split("T")[0];

  // Group scheduled pieces by date (extract date from timestamp)
  const piecesByDate = useMemo(() => {
    const groups: Record<string, SchedulePiece[]> = {};
    for (const piece of scheduled) {
      const date = piece.scheduled_for!.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(piece);
    }
    // Sort pieces within each day by time
    for (const date of Object.keys(groups)) {
      groups[date].sort((a, b) =>
        (a.scheduled_for ?? "").localeCompare(b.scheduled_for ?? ""),
      );
    }
    return groups;
  }, [scheduled]);

  // Filter unscheduled by product
  const filteredUnscheduled = useMemo(() => {
    if (!productFilter) return unscheduled;
    return unscheduled.filter((p) => p.product_id === productFilter);
  }, [unscheduled, productFilter]);

  async function handleUnschedule(pieceId: string) {
    const result = await updateContentPieceSchedule(pieceId, null);
    if (result.success) {
      const piece = scheduled.find((p) => p.id === pieceId);
      if (piece) {
        setScheduled((prev) => prev.filter((p) => p.id !== pieceId));
        setUnscheduled((prev) => [{ ...piece, scheduled_for: null, status: "approved" }, ...prev]);
        if (selectedPiece?.id === pieceId) setSelectedPiece(null);
      }
    }
  }

  function handleLifecycleChange(pieceId: string, newStatus: string, scheduledFor?: string | null, postedAt?: string | null) {
    // If a piece just got scheduled, move it from unscheduled to scheduled
    if (newStatus === "scheduled" && scheduledFor) {
      const fromUnscheduled = unscheduled.find((p) => p.id === pieceId);
      if (fromUnscheduled) {
        const updated = { ...fromUnscheduled, status: newStatus, scheduled_for: scheduledFor, posted_at: null };
        setUnscheduled((prev) => prev.filter((p) => p.id !== pieceId));
        setScheduled((prev) => [...prev, updated]);
        if (selectedPiece?.id === pieceId) setSelectedPiece(updated);
        return;
      }
    }

    // If a scheduled piece got unscheduled (reverted to draft/approved), move it back
    if (newStatus === "draft" || newStatus === "approved") {
      const fromScheduled = scheduled.find((p) => p.id === pieceId);
      if (fromScheduled) {
        const updated = { ...fromScheduled, status: newStatus, scheduled_for: null, posted_at: null };
        setScheduled((prev) => prev.filter((p) => p.id !== pieceId));
        setUnscheduled((prev) => [updated, ...prev]);
        if (selectedPiece?.id === pieceId) setSelectedPiece(updated);
        return;
      }
    }

    // Otherwise update in place
    setScheduled((prev) =>
      prev.map((p) => {
        if (p.id !== pieceId) return p;
        const updated = {
          ...p,
          status: newStatus,
          scheduled_for: newStatus === "scheduled" ? (scheduledFor ?? p.scheduled_for) : p.scheduled_for,
          posted_at: newStatus === "posted" ? (postedAt ?? new Date().toISOString()) : newStatus === "draft" || newStatus === "approved" || newStatus === "scheduled" ? null : p.posted_at,
        };
        if (selectedPiece?.id === pieceId) setSelectedPiece(updated);
        return updated;
      }),
    );
    setUnscheduled((prev) =>
      prev.map((p) => {
        if (p.id !== pieceId) return p;
        const updated = {
          ...p,
          status: newStatus,
          posted_at: newStatus === "posted" ? (postedAt ?? new Date().toISOString()) : newStatus === "draft" || newStatus === "approved" || newStatus === "scheduled" ? null : p.posted_at,
        };
        if (selectedPiece?.id === pieceId) setSelectedPiece(updated);
        return updated;
      }),
    );
  }

  function navigateWeek(direction: "prev" | "next") {
    const newOffset = direction === "prev" ? weekOffset - 1 : weekOffset + 1;
    router.push(`/schedule?week=${newOffset}`);
  }

  function goToThisWeek() {
    router.push("/schedule");
  }

  return (
    <div className="space-y-6">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateWeek("prev")}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]"
        >
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Prev
          </span>
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{getWeekLabel(weekDays)}</h2>
          {weekOffset !== 0 && (
            <button
              onClick={goToThisWeek}
              className="mt-0.5 text-xs text-indigo-400 hover:text-indigo-300"
            >
              Back to this week
            </button>
          )}
        </div>
        <button
          onClick={() => navigateWeek("next")}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]"
        >
          <span className="flex items-center gap-1.5">
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
        </button>
      </div>

      {/* 7-day calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const pieces = piecesByDate[day.date] || [];
          const isToday = day.date === todayStr;
          const isPast = day.date < todayStr;

          return (
            <div
              key={day.date}
              className={`flex min-h-[200px] flex-col rounded-xl border bg-white/[0.02] p-3 ${
                isToday
                  ? "border-indigo-500/40"
                  : "border-white/[0.06]"
              }`}
            >
              {/* Day header */}
              <div className="mb-2 border-b border-white/[0.06] pb-2">
                <p className={`text-xs font-medium ${isToday ? "text-indigo-400" : "text-zinc-500"}`}>
                  {day.label}
                </p>
                <p className={`text-lg font-bold ${isToday ? "text-indigo-300" : isPast ? "text-zinc-600" : ""}`}>
                  {day.dayOfMonth}
                </p>
              </div>

              {/* Scheduled pieces */}
              <div className="flex-1 space-y-2">
                {pieces.map((piece) => (
                  <CalendarCard
                    key={piece.id}
                    piece={piece}
                    onSelect={() => setSelectedPiece(piece)}
                  />
                ))}
              </div>

              {/* Empty day indicator */}
              {pieces.length === 0 && (
                <p className="py-4 text-center text-xs text-zinc-700">
                  No content
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Unscheduled content pool */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center gap-4">
          <div>
            <h3 className="font-semibold">Unscheduled Content</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {filteredUnscheduled.length} piece{filteredUnscheduled.length === 1 ? "" : "s"} ready to schedule
            </p>
          </div>
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
        </div>

        {filteredUnscheduled.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
            <p className="text-sm text-zinc-500">
              No unscheduled content. Everything is scheduled or archived.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUnscheduled.map((piece) => (
              <UnscheduledCard
                key={piece.id}
                piece={piece}
                onLifecycleChange={(s, sf, pa) => handleLifecycleChange(piece.id, s, sf, pa)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content detail panel */}
      {selectedPiece && (
        <ContentPanel
          piece={selectedPiece}
          onClose={() => setSelectedPiece(null)}
          onUnschedule={() => handleUnschedule(selectedPiece.id)}
          onLifecycleChange={(s, sf, pa) => handleLifecycleChange(selectedPiece.id, s, sf, pa)}
        />
      )}
    </div>
  );
}

// ── Calendar card (compact, in day column) ──────────
function CalendarCard({
  piece,
  onSelect,
}: {
  piece: SchedulePiece;
  onSelect: () => void;
}) {
  const statusDot =
    piece.status === "posted" ? "bg-emerald-400" :
    piece.status === "scheduled" ? "bg-violet-400" :
    piece.status === "approved" ? "bg-blue-400" :
    "bg-amber-400";

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border bg-white/[0.03] p-2 text-left transition-colors hover:bg-white/[0.06] ${
        piece.status === "posted" ? "border-emerald-500/20 opacity-70" : "border-white/[0.06]"
      }`}
    >
      {/* Row 1: channel pill + time */}
      <div className="flex items-center justify-between gap-1">
        {piece.campaigns && (
          <ChannelPill channel={piece.campaigns.channel} />
        )}
        {piece.scheduled_for && (
          <p className="shrink-0 text-[10px] text-indigo-400/70">
            {new Date(piece.scheduled_for).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        )}
      </div>

      {/* Row 2: title */}
      <p className="mt-1 truncate text-xs font-medium text-zinc-300">
        {piece.title ?? piece.campaigns?.angle ?? "Untitled"}
      </p>

      {/* Row 3: product + status dot */}
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot}`} />
        {piece.products && (
          <p className="truncate text-[10px] text-zinc-600">
            {piece.products.name}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Content detail panel (slide-over) ────────────────
function ContentPanel({
  piece,
  onClose,
  onUnschedule,
  onLifecycleChange,
}: {
  piece: SchedulePiece;
  onClose: () => void;
  onUnschedule: () => void;
  onLifecycleChange: (newStatus: string, scheduledFor?: string | null, postedAt?: string | null) => void;
}) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/[0.06] bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.06] p-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {piece.campaigns && (
                <ChannelPill channel={piece.campaigns.channel} />
              )}
              <TypePill type={piece.type} />
            </div>
            {piece.products && (
              <p className="mt-2 text-sm font-medium text-zinc-400">
                {piece.products.name}
              </p>
            )}
            <h2 className="mt-2 text-lg font-semibold">
              {piece.title ?? piece.campaigns?.angle ?? "Untitled"}
            </h2>
            {piece.campaigns?.angle && piece.title && (
              <p className="mt-1 text-sm italic text-zinc-400">
                &ldquo;{piece.campaigns.angle}&rdquo;
              </p>
            )}
            {piece.scheduled_for && (
              <p className="mt-2 text-xs text-indigo-400/80">
                Scheduled for{" "}
                {new Date(piece.scheduled_for).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                at{" "}
                {new Date(piece.scheduled_for).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-zinc-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Actions */}
          <div className="mb-6 flex items-center justify-between">
            <LifecycleAction
              pieceId={piece.id}
              status={piece.status}
              scheduledFor={piece.scheduled_for}
              postedAt={piece.posted_at}
              onStatusChange={onLifecycleChange}
            />
            <div className="flex items-center gap-2">
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
              {piece.status === "scheduled" && (
                <button
                  onClick={onUnschedule}
                  className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-zinc-200"
                >
                  Unschedule
                </button>
              )}
            </div>
          </div>

          {/* Content body */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {piece.body}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Unscheduled card (in pool below calendar) ───────
function UnscheduledCard({
  piece,
  onLifecycleChange,
}: {
  piece: SchedulePiece;
  onLifecycleChange: (newStatus: string, scheduledFor?: string | null, postedAt?: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {piece.campaigns && (
            <ChannelPill channel={piece.campaigns.channel} />
          )}
          <TypePill type={piece.type} />
          {piece.products && (
            <span className="text-xs text-zinc-500">{piece.products.name}</span>
          )}
        </div>
        <p className="mt-1.5 truncate text-sm font-medium text-zinc-300">
          {piece.title ?? piece.campaigns?.angle ?? "Untitled"}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
          {piece.body}
        </p>
      </div>
      <div className="relative flex shrink-0 items-center gap-2">
        <LifecycleAction
          pieceId={piece.id}
          status={piece.status}
          scheduledFor={piece.scheduled_for}
          postedAt={piece.posted_at}
          onStatusChange={onLifecycleChange}
        />
      </div>
    </div>
  );
}
