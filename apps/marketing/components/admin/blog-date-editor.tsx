"use client";

import { useState } from "react";
import { updatePublishedDate } from "@/app/admin/blog/actions";

export type AdminPost = {
  slug: string;
  title: string;
  published: boolean;
  published_at: string;
};

// published_at is stored at noon UTC, so the calendar day is just the UTC date.
function toDateInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function BlogDateEditor({ posts }: { posts: AdminPost[] }) {
  const [apiKey, setApiKey] = useState("");

  if (posts.length === 0) {
    return (
      <p className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-zinc-400">
        No posts found.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Publish key
        </span>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your BLOG_PUBLISH_API_KEY"
          className="mt-1.5 block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        />
      </label>

      <ul className="mt-6 flex flex-col gap-3">
        {posts.map((post) => (
          <PostRow key={post.slug} post={post} apiKey={apiKey} />
        ))}
      </ul>
    </div>
  );
}

function PostRow({ post, apiKey }: { post: AdminPost; apiKey: string }) {
  const [date, setDate] = useState(() => toDateInput(post.published_at));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const dirty = date !== toDateInput(post.published_at);

  async function handleSave() {
    setStatus("saving");
    setMessage("");
    const result = await updatePublishedDate(post.slug, date, apiKey);
    if (result.ok) {
      setStatus("saved");
      setMessage("Saved");
    } else {
      setStatus("error");
      setMessage(result.error ?? "Couldn't save.");
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-100">
          {post.title}
          {!post.published && (
            <span className="ml-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-400">
              Draft
            </span>
          )}
        </p>
        <p className="truncate text-xs text-zinc-500">/blog/{post.slug}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setStatus("idle");
            setMessage("");
          }}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 [color-scheme:dark] focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || !apiKey || status === "saving"}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {message && (
          <span
            className={`text-xs ${
              status === "error" ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </li>
  );
}
