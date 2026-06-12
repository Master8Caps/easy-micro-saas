// DORMANT: the post flow now renders code-built graphics (PostGraphic) and no
// longer calls this hook. Kept in case AI imagery is reintroduced elsewhere.
"use client";

import { useEffect, useState } from "react";
import type { MagicSamplePost } from "@/lib/magic/types";

export type PostImageState = { url?: string; loading: boolean };

/**
 * After unlock, request one AI image per post (in parallel). Posts that already
 * have an imageUrl are used as-is. A null response leaves the post imageless
 * (the card falls back to its gradient). Fires once per id.
 */
export function usePostImages(id: string, posts: MagicSamplePost[]): PostImageState[] {
  const [states, setStates] = useState<PostImageState[]>(() =>
    posts.map((p) => ({ url: p.imageUrl, loading: !p.imageUrl })),
  );

  useEffect(() => {
    let cancelled = false;
    posts.forEach((p, index) => {
      if (p.imageUrl) return;
      fetch("/api/magic/visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, postIndex: index }),
      })
        .then((r) => r.json())
        .then((data: { imageUrl?: string | null }) => {
          if (cancelled) return;
          setStates((prev) => {
            const next = [...prev];
            next[index] = { url: data.imageUrl ?? undefined, loading: false };
            return next;
          });
        })
        .catch(() => {
          if (cancelled) return;
          setStates((prev) => {
            const next = [...prev];
            next[index] = { url: undefined, loading: false };
            return next;
          });
        });
    });
    return () => {
      cancelled = true;
    };
    // Fire once per id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return states;
}
