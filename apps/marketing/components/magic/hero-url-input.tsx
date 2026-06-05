"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroUrlInput() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) router.push(`/start?url=${encodeURIComponent(url.trim())}`);
      }}
      className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="yourwebsite.com"
        aria-label="Your website address"
        className="flex-1 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-indigo-500/50 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/[0.1]"
      >
        See your brand DNA →
      </button>
    </form>
  );
}
