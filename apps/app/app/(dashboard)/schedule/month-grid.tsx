"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";

interface MonthGridProps {
  year: number;
  month: number; // 0-indexed
  piecesByDate: Record<string, { id: string; status: string }[]>;
  metricoolPostsByDate?: Record<string, { id: string; platform: string; status: string }[]>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

function getMonthGridDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // Pad to Monday start
  const firstDay = first.getDay(); // 0=Sun
  const startPad = firstDay === 0 ? 6 : firstDay - 1;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startPad);

  const lastDay = last.getDay();
  const endPad = lastDay === 0 ? 0 : 7 - lastDay;
  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + endPad);

  const days: { date: string; dayOfMonth: number; inMonth: boolean }[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push({
      date: cursor.toISOString().split("T")[0],
      dayOfMonth: cursor.getDate(),
      inMonth: cursor.getMonth() === month && cursor.getFullYear() === year,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_DOT: Record<string, string> = {
  posted: "bg-emerald-400",
  scheduled: "bg-violet-400",
  approved: "bg-blue-400",
  draft: "bg-amber-400",
};

function DayCell({
  day,
  pieces,
  metricoolPosts = [],
  isToday,
  isSelected,
  onSelect,
}: {
  day: { date: string; dayOfMonth: number; inMonth: boolean };
  pieces: { id: string; status: string }[];
  metricoolPosts?: { id: string; platform: string; status: string }[];
  isToday: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.date}`,
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onSelect}
      className={`flex min-h-[80px] flex-col items-start rounded-lg border p-2 text-left transition-colors ${
        isOver
          ? "border-indigo-500 ring-2 ring-indigo-500/30"
          : isSelected
            ? "border-indigo-500/60 bg-indigo-500/10"
            : isToday
              ? "border-indigo-500/40 bg-surface-card"
              : "border-line bg-surface-card"
      } ${
        day.inMonth ? "" : "opacity-40"
      } hover:bg-surface-card-hover`}
    >
      <span
        className={`text-sm font-medium ${
          isToday
            ? "text-indigo-400"
            : day.inMonth
              ? "text-content-secondary"
              : "text-content-muted"
        }`}
      >
        {day.dayOfMonth}
      </span>

      {/* Status dots */}
      {(pieces.length > 0 || metricoolPosts.length > 0) && (
        <div className="mt-1 flex flex-wrap gap-1">
          {pieces.slice(0, 3).map((p) => (
            <span
              key={p.id}
              className={`h-2 w-2 rounded-full ${STATUS_DOT[p.status] ?? "bg-gray-400"}`}
            />
          ))}
          {pieces.length > 3 && (
            <span className="text-[10px] text-content-muted">
              +{pieces.length - 3}
            </span>
          )}
          {metricoolPosts.slice(0, 3).map((mp) => (
            <span
              key={mp.id}
              className="h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-emerald-400/40"
              title={`${mp.platform} — ${mp.status}`}
            />
          ))}
          {metricoolPosts.length > 3 && (
            <span className="text-[10px] text-emerald-400">
              +{metricoolPosts.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export function MonthGrid({
  year,
  month,
  piecesByDate,
  metricoolPostsByDate = {},
  selectedDate,
  onSelectDate,
}: MonthGridProps) {
  const days = useMemo(() => getMonthGridDays(year, month), [year, month]);
  // Stable for the lifetime of the component — "today" won't change mid-session
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [year, month]);

  return (
    <div>
      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY_HEADERS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-xs font-medium text-content-muted"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const pieces = piecesByDate[day.date] || [];
          return (
            <DayCell
              key={day.date}
              day={day}
              pieces={pieces}
              metricoolPosts={metricoolPostsByDate[day.date] ?? []}
              isToday={day.date === todayStr}
              isSelected={day.date === selectedDate}
              onSelect={() => onSelectDate(day.date)}
            />
          );
        })}
      </div>
    </div>
  );
}
