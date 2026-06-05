// Code-built product mockups for the home-page showcase. Pure presentational
// markup (no real data) — each is shown inside a ShowcaseFrame that can swap in
// a real screenshot later. Restylable for the calm/Scandinavian variant.

/** ① "Tinder for social" — swipe-to-approve post card (the hero mechanic). */
export function SwipeCardMock() {
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      {/* Peeking card behind, for the swipe-stack feel */}
      <div className="absolute inset-x-3 -top-2 h-full rounded-2xl border border-white/[0.05] bg-white/[0.02]" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-zinc-900/80 p-3 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-amber-400" />
          <span className="text-xs font-medium text-zinc-300">Instagram</span>
        </div>

        {/* Post image placeholder */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-zinc-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-zinc-200">
          Your launch is live — here&apos;s how to find your first 100 users.
        </p>
        <p className="mt-1 text-[11px] text-indigo-300/80">
          #saas #indiehacker #buildinpublic
        </p>

        {/* Swipe actions */}
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-7.5-4.6-10-9.3C.6 8.5 2.2 5 5.5 5c2 0 3.3 1.1 4.5 2.6C11.2 6.1 12.5 5 14.5 5 17.8 5 19.4 8.5 18 11.7 15.5 16.4 12 21 12 21z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ② Content queue — upcoming posts across platforms with status pills. */
export function ContentQueueMock() {
  const rows = [
    { day: "Mon", platform: "Instagram", title: "Launch announcement", status: "Approved", tone: "emerald" },
    { day: "Tue", platform: "X", title: "Build-in-public thread", status: "Draft", tone: "amber" },
    { day: "Wed", platform: "LinkedIn", title: "Founder lessons", status: "Scheduled", tone: "indigo" },
    { day: "Thu", platform: "Instagram", title: "Product reel", status: "Approved", tone: "emerald" },
  ] as const;

  const toneMap: Record<string, string> = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {rows.map((r) => (
        <div
          key={r.day}
          className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
        >
          <span className="w-8 shrink-0 text-[11px] font-semibold uppercase text-zinc-500">
            {r.day}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-200">
              {r.title}
            </p>
            <p className="text-[10px] text-zinc-500">{r.platform}</p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${toneMap[r.tone]}`}
          >
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}

/** ③ Ad set preview — ad creative with variations + avatar targeting. */
export function AdSetMock() {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-400">
          Ad · Variation 1 of 3
        </span>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="mb-3 aspect-[16/9] overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/25 to-violet-500/10" />
        <p className="text-sm font-semibold text-zinc-100">
          Ship faster. Market smarter.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Turn your product into campaigns that actually convert — without an
          agency.
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span>🎯</span>
          <span>Targeting:</span>
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 font-medium text-indigo-300">
            Solo Founders
          </span>
        </div>
      </div>
    </div>
  );
}

/** ④ Brand DNA + avatars — voice, palette, customer avatars (pre-purchase payoff). */
export function BrandDnaMock() {
  const avatars = [
    { initials: "MA", name: "Maya, 32", pain: "No time to market" },
    { initials: "TO", name: "Tom, 41", pain: "Can't reach buyers" },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Brand voice
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["Calm", "Direct", "Witty"].map((v) => (
            <span
              key={v}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-300"
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Palette
        </p>
        <div className="flex gap-1.5">
          {["bg-indigo-500", "bg-violet-500", "bg-fuchsia-500", "bg-zinc-200"].map(
            (c) => (
              <span key={c} className={`h-6 w-6 rounded-md ${c}`} />
            ),
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {avatars.map((a) => (
          <div
            key={a.initials}
            className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-[10px] font-bold text-white">
                {a.initials}
              </div>
              <span className="text-xs font-medium text-zinc-200">
                {a.name}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-zinc-500">Pain: {a.pain}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
