import type { ReactNode } from "react";

// ── Channel pill colors ──────────────────────────────
const channelStyles: Record<string, string> = {
  linkedin: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "x / twitter": "border-zinc-400/30 bg-zinc-400/10 text-content-secondary",
  "x/twitter": "border-zinc-400/30 bg-zinc-400/10 text-content-secondary",
  twitter: "border-zinc-400/30 bg-zinc-400/10 text-content-secondary",
  x: "border-zinc-400/30 bg-zinc-400/10 text-content-secondary",
  reddit: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  "product hunt": "border-rose-500/30 bg-rose-500/10 text-rose-400",
  "indie hackers": "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  email: "border-accent-2/30 bg-accent-2/10 text-accent-2",
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

// ── Channel platform icons (brand glyphs) ────────────
function icon(path: string) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const channelIcons: Record<string, ReactNode> = {
  facebook: icon("M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"),
  meta: icon("M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"),
  linkedin: icon("M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"),
  "linkedin ads": icon("M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"),
  twitter: icon("M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z"),
  x: icon("M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z"),
  "x / twitter": icon("M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z"),
  "x/twitter": icon("M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3L17.61 20.65z"),
  instagram: icon("M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.4-10.4a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44z"),
  youtube: icon("M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.53 9.38.53 9.38.53s7.5 0 9.38-.53a3 3 0 0 0 2.12-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6z"),
  tiktok: icon("M16.6 5.82a4.28 4.28 0 0 1-1.01-2.82h-3.3v13.18a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .76-5.06v-3.36a5.92 5.92 0 0 0-.76-.05 5.95 5.95 0 1 0 5.95 5.95V8.99a7.56 7.56 0 0 0 4.4 1.41V7.1a4.28 4.28 0 0 1-3.45-1.28z"),
  pinterest: icon("M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.43.22-.93 1.4-5.95 1.4-5.95s-.36-.72-.36-1.78c0-1.66.97-2.9 2.17-2.9 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 4-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.4 2.55-5.4 5.19 0 1.03.4 2.13.9 2.73a.36.36 0 0 1 .08.34c-.09.38-.3 1.19-.34 1.35-.05.22-.18.27-.41.16-1.52-.71-2.47-2.92-2.47-4.7 0-3.83 2.78-7.35 8.02-7.35 4.21 0 7.48 3 7.48 7.01 0 4.18-2.64 7.55-6.3 7.55-1.23 0-2.39-.64-2.79-1.4l-.76 2.89c-.27 1.06-1.01 2.38-1.5 3.19A12 12 0 1 0 12 0z"),
  reddit: icon("M24 11.78a2.46 2.46 0 0 0-2.46-2.46c-.67 0-1.27.27-1.71.7a12.06 12.06 0 0 0-6.32-1.99l1.08-5.06 3.52.75a1.76 1.76 0 1 0 .18-.84l-3.92-.83a.42.42 0 0 0-.5.32l-1.2 5.66a12.1 12.1 0 0 0-6.42 1.99 2.46 2.46 0 1 0-2.71 4.04 4.84 4.84 0 0 0-.06.74c0 3.77 4.39 6.83 9.81 6.83s9.81-3.06 9.81-6.83c0-.25-.02-.49-.06-.73A2.46 2.46 0 0 0 24 11.78zM6.67 13.54a1.76 1.76 0 1 1 3.52 0 1.76 1.76 0 0 1-3.52 0zm9.81 4.64c-1.2 1.2-3.5 1.29-4.18 1.29s-2.98-.09-4.18-1.29a.46.46 0 0 1 .65-.65c.76.76 2.37.97 3.53.97s2.78-.21 3.53-.97a.46.46 0 0 1 .65.65zm-.31-2.88a1.76 1.76 0 1 1 0-3.52 1.76 1.76 0 0 1 0 3.52z"),
};

function getChannelIcon(channel: string): ReactNode {
  return channelIcons[channel.toLowerCase()] ?? null;
}

function getChannelStyle(channel: string) {
  return (
    channelStyles[channel.toLowerCase()] ??
    "border-zinc-600/30 bg-zinc-600/10 text-content-secondary"
  );
}

export function ChannelPill({ channel }: { channel: string }) {
  const glyph = getChannelIcon(channel);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getChannelStyle(channel)}`}
    >
      {glyph}
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
    <span className="rounded-md border border-accent/20 bg-accent/5 px-2 py-0.5 text-xs text-accent/70">
      {formatContentType(type)}
    </span>
  );
}

// ── Status pill ──────────────────────────────────────
const statusStyles: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  archived: "border-zinc-600/30 bg-zinc-600/10 text-content-muted",
  ready: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  approved: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  scheduled: "border-accent-2/30 bg-accent-2/10 text-accent-2",
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
    <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2 py-0.5 text-xs font-medium text-content-muted">
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
      className="rounded-md p-1 text-content-muted transition-colors hover:bg-surface-tertiary hover:text-content-secondary"
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
