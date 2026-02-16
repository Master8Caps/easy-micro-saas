// ── Channel pill colors ──────────────────────────────
const channelStyles: Record<string, string> = {
  linkedin: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "x / twitter": "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
  "x/twitter": "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
  twitter: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
  x: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
  reddit: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  "product hunt": "border-rose-500/30 bg-rose-500/10 text-rose-400",
  "indie hackers": "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  email: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  "blog / seo": "border-green-500/30 bg-green-500/10 text-green-400",
  blog: "border-green-500/30 bg-green-500/10 text-green-400",
  seo: "border-green-500/30 bg-green-500/10 text-green-400",
  "paid ads": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  meta: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  google: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  tiktok: "border-pink-500/30 bg-pink-500/10 text-pink-400",
  facebook: "border-blue-600/30 bg-blue-600/10 text-blue-400",
  instagram: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400",
  youtube: "border-red-500/30 bg-red-500/10 text-red-400",
  pinterest: "border-red-400/30 bg-red-400/10 text-red-300",
  "linkedin ads": "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

function getChannelStyle(channel: string) {
  return (
    channelStyles[channel.toLowerCase()] ??
    "border-zinc-600/30 bg-zinc-600/10 text-zinc-400"
  );
}

export function ChannelPill({ channel }: { channel: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getChannelStyle(channel)}`}
    >
      {channel}
    </span>
  );
}

// ── Content type pill ────────────────────────────────
const typeLabels: Record<string, string> = {
  "linkedin-post": "Text Post",
  "twitter-post": "Text Post",
  "facebook-post": "Facebook Post",
  "twitter-thread": "Thread",
  "video-script": "Video Script",
  "image-prompt": "Image Post",
  "landing-page-copy": "Landing Page",
  email: "Email",
  "ad-copy": "Ad Copy",
  "email-sequence": "Email Sequence",
  "meta-description": "Meta Description",
  tagline: "Tagline",
};

function formatContentType(type: string) {
  return (
    typeLabels[type] ??
    type
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export function TypePill({ type }: { type: string }) {
  return (
    <span className="rounded-md border border-indigo-500/20 bg-indigo-500/5 px-2 py-0.5 text-xs text-indigo-300/70">
      {formatContentType(type)}
    </span>
  );
}

// ── Status pill ──────────────────────────────────────
const statusStyles: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  archived: "border-zinc-600/30 bg-zinc-600/10 text-zinc-500",
  ready: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  approved: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  scheduled: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  posted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

export function StatusPill({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? statusStyles.draft}`}
    >
      {label}
    </span>
  );
}

// ── Archived badge ──────────────────────────────────
export function ArchivedBadge() {
  return (
    <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2 py-0.5 text-xs font-medium text-zinc-500">
      Archived
    </span>
  );
}

// ── Archive toggle button ───────────────────────────
export function ArchiveToggle({
  archived,
  onToggle,
}: {
  archived: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={archived ? "Unarchive" : "Archive"}
      className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
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
      >
        {archived ? (
          <>
            <path d="M21 8V21H3V8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </>
        ) : (
          <>
            <path d="M21 8V21H3V8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </>
        )}
      </svg>
    </button>
  );
}
