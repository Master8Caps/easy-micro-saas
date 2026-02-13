"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface WaitlistButtonProps {
  source?: string;
  label?: string;
  className?: string;
}

export function WaitlistButton({
  source = "marketing-site",
  label = "Get Early Access",
  className,
}: WaitlistButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/[0.1]"
        }
      >
        {label}
      </button>
      {open &&
        createPortal(
          <WaitlistModal source={source} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}

function WaitlistModal({
  source,
  onClose,
}: {
  source: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/[0.08] bg-zinc-900 p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
          aria-label="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-heading text-lg font-semibold">
              You&apos;re on the list
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              We&apos;ll reach out when early access opens up.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-full border border-white/[0.1] bg-white/[0.05] px-6 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08]"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-heading text-xl font-semibold">
              Join the Waitlist
            </h3>
            <p className="mt-1.5 text-sm text-zinc-400">
              Early access opening soon. Be first in line.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-1 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-zinc-200 disabled:opacity-50"
              >
                {status === "loading" ? "Joining..." : "Join the Waitlist"}
              </button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
