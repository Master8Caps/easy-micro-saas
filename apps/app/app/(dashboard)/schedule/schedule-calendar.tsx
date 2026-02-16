"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChannelPill, TypePill } from "@/components/pills";
import { CopyButton } from "@/components/copy-button";
import { LifecycleAction } from "@/components/lifecycle-action";
import { DatePicker } from "@/components/date-picker";
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
  const [expandedPiece, setExpandedPiece] = useState<string | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const todayStr = new Date().toISOString().split("T")[0];

  // Group scheduled pieces by date
  const piecesByDate = useMemo(() => {
    const groups: Record<string, SchedulePiece[]> = {};
    for (const piece of scheduled) {
      const date = piece.scheduled_for!;
      if (!groups[date]) groups[date] = [];
      groups[date].push(piece);
    }
    return groups;
  }, [scheduled]);

  // Filter unscheduled by product
  const filteredUnscheduled = useMemo(() => {
    if (!productFilter) return unscheduled;
    return unscheduled.filter((p) => p.product_id === productFilter);
  }, [unscheduled, productFilter]);

  async function handleSchedule(pieceId: string, date: string) {
    const result = await updateContentPieceSchedule(pieceId, date);
    if (result.success) {
      const piece = unscheduled.find((p) => p.id === pieceId);
      if (piece) {
        setUnscheduled((prev) => prev.filter((p) => p.id !== pieceId));
        setScheduled((prev) => [...prev, { ...piece, scheduled_for: date, status: "scheduled" }]);
      }
    }
  }

  async function handleUnschedule(pieceId: string) {
    const result = await updateContentPieceSchedule(pieceId, null);
    if (result.success) {
      const piece = scheduled.find((p) => p.id === pieceId);
      if (piece) {
        setScheduled((prev) => prev.filter((p) => p.id !== pieceId));
        setUnscheduled((prev) => [{ ...piece, scheduled_for: null, status: "approved" }, ...prev]);
      }
    }
  }

  function handleLifecycleChange(pieceId: string, newStatus: string, scheduledFor?: string | null, postedAt?: string | null) {
    setScheduled((prev) =>
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
    setUnscheduled((prev) =>
      prev.map((p) =>
        p.id === pieceId
          ? {
              ...p,
              status: newStatus,
              posted_at: newStatus === "posted" ? (postedAt ?? new Date().toISOString()) : newStatus === "draft" || newStatus === "approved" || newStatus === "scheduled" ? null : p.posted_at,
            }
          : p,
      ),
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
                    expanded={expandedPiece === piece.id}
                    onToggleExpand={() =>
                      setExpandedPiece((prev) =>
                        prev === piece.id ? null : piece.id,
                      )
                    }
                    onUnschedule={() => handleUnschedule(piece.id)}
                    onLifecycleChange={(s, sf, pa) => handleLifecycleChange(piece.id, s, sf, pa)}
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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Unscheduled Content</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {filteredUnscheduled.length} piece{filteredUnscheduled.length === 1 ? "" : "s"} ready to schedule
            </p>
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
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
                onSchedule={(date) => handleSchedule(piece.id, date)}
                onLifecycleChange={(s, sf, pa) => handleLifecycleChange(piece.id, s, sf, pa)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Calendar card (compact, in day column) ──────────
function CalendarCard({
  piece,
  expanded,
  onToggleExpand,
  onUnschedule,
  onLifecycleChange,
}: {
  piece: SchedulePiece;
  expanded: boolean;
  onToggleExpand: () => void;
  onUnschedule: () => void;
  onLifecycleChange: (newStatus: string, scheduledFor?: string | null, postedAt?: string | null) => void;
}) {
  return (
    <div className={`rounded-lg border bg-white/[0.03] ${piece.status === "posted" ? "border-emerald-500/20 opacity-70" : "border-white/[0.06]"}`}>
      <button
        onClick={onToggleExpand}
        className="w-full p-2 text-left"
      >
        <div className="flex items-center gap-1.5">
          {piece.campaigns && (
            <ChannelPill channel={piece.campaigns.channel} />
          )}
          <div className="flex-1" />
          <div onClick={(e) => e.stopPropagation()}>
            <LifecycleAction
              pieceId={piece.id}
              status={piece.status}
              scheduledFor={piece.scheduled_for}
              postedAt={piece.posted_at}
              onStatusChange={onLifecycleChange}
            />
          </div>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-zinc-300">
          {piece.title ?? piece.campaigns?.angle ?? "Untitled"}
        </p>
        {piece.products && (
          <p className="truncate text-[10px] text-zinc-600">
            {piece.products.name}
          </p>
        )}
      </button>

      {/* Expanded view */}
      {expanded && (
        <div className="border-t border-white/[0.06] p-2">
          <div className="flex items-center gap-1.5">
            <TypePill type={piece.type} />
            <div className="flex-1" />
            <CopyButton text={piece.body} />
            <button
              onClick={onUnschedule}
              title="Unschedule"
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">
            {piece.body}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Unscheduled card (in pool below calendar) ───────
function UnscheduledCard({
  piece,
  onSchedule,
  onLifecycleChange,
}: {
  piece: SchedulePiece;
  onSchedule: (date: string) => void;
  onLifecycleChange: (newStatus: string, scheduledFor?: string | null, postedAt?: string | null) => void;
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);

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
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/15"
        >
          Schedule
        </button>
        {showDatePicker && (
          <div className="absolute right-0 top-full z-50 mt-1">
            <DatePicker
              onChange={(date) => {
                setShowDatePicker(false);
                onSchedule(date);
              }}
              onClose={() => setShowDatePicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
