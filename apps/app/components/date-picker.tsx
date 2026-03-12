"use client";

import { useState, useEffect, useRef } from "react";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TIME_SLOTS = Array.from({ length: 32 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const minute = (i % 2) * 30;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  const label = `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
  return { value, label };
});

export function DatePicker({
  value,
  onChange,
  onClose,
}: {
  value?: string | null;
  onChange: (date: string) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Parse existing value for day and time
  const [selectedDay, setSelectedDay] = useState<string | null>(() => {
    if (value) return value.split("T")[0];
    return null;
  });
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (value && value.includes("T")) {
      const d = new Date(value);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return "09:00";
  });

  const ref = useRef<HTMLDivElement>(null);
  const timeGridRef = useRef<HTMLDivElement>(null);

  // Scroll selected time into view when day is picked
  useEffect(() => {
    if (selectedDay && timeGridRef.current) {
      const selected = timeGridRef.current.querySelector("[data-selected]");
      if (selected) {
        selected.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }
  }, [selectedDay]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function selectDay(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDay(dateStr);
  }

  function handleConfirm() {
    if (!selectedDay) return;
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const d = new Date(`${selectedDay}T00:00:00`);
    d.setHours(hours, minutes, 0, 0);
    onChange(d.toISOString());
    onClose();
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to fill last row
  while (cells.length % 7 !== 0) cells.push(null);

  const confirmLabel = selectedDay
    ? `${new Date(`${selectedDay}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${TIME_SLOTS.find((s) => s.value === selectedTime)?.label}`
    : "";

  return (
    <div
      ref={ref}
      className="w-[280px] rounded-xl border border-line bg-surface-secondary p-4 shadow-2xl"
    >
      {/* Month header */}
      <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
        <button
          onClick={prevMonth}
          className="rounded-md p-1.5 text-content-secondary transition-colors hover:bg-surface-card-hover hover:text-content-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-content-primary">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="rounded-md p-1.5 text-content-secondary transition-colors hover:bg-surface-card-hover hover:text-content-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-0">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="py-1 text-center text-xs font-medium text-content-muted">
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-9 w-full" />;
          }

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;
          const isPast = dateStr < todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => selectDay(day)}
              className={`flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-indigo-500/30 font-medium text-indigo-200"
                  : isToday
                    ? "border border-indigo-500/30 font-medium text-content-primary"
                    : isPast
                      ? "text-content-muted hover:bg-surface-card-hover hover:text-content-secondary"
                      : "text-content-secondary hover:bg-indigo-500/15 hover:text-indigo-200"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time selector — shown after day is selected */}
      {selectedDay && (
        <>
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-2 text-xs font-medium text-content-secondary">Time</p>
            <div
              ref={timeGridRef}
              className="grid max-h-[140px] grid-cols-3 gap-1 overflow-y-auto pr-1"
            >
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.value}
                  onClick={() => setSelectedTime(slot.value)}
                  {...(selectedTime === slot.value ? { "data-selected": true } : {})}
                  className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
                    selectedTime === slot.value
                      ? "bg-indigo-500/30 font-medium text-indigo-200"
                      : "text-content-secondary hover:bg-surface-card-hover hover:text-content-primary"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="mt-3 w-full rounded-lg bg-indigo-500/20 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/30"
          >
            Schedule for {confirmLabel}
          </button>
        </>
      )}
    </div>
  );
}
