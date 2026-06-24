"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calmHome } from "@/content/home.calm";

export function CalmHeroUrlInput() {
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
        placeholder="yourbusiness.com"
        aria-label="Your website address"
        className="flex-1 rounded-full border border-ink/10 bg-surface px-5 py-3 text-sm text-ink placeholder-muted/60 transition-colors focus:border-primary/50 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-paper transition-all hover:opacity-90"
      >
        {calmHome.hero.cta}
      </button>
    </form>
  );
}
