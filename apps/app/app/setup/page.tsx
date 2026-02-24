"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/server/actions/settings";

export default function SetupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: pwError } = await supabase.auth.updateUser({
      password,
    });

    if (pwError) {
      setError(pwError.message);
      setLoading(false);
      return;
    }

    if (fullName.trim()) {
      const result = await updateProfile(fullName);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 32 32" className="mx-auto">
            <path d="M16,3 Q21,10 21,18 Q21,24 16,24 Q11,24 11,18 Q11,10 16,3Z" fill="#6366f1"/>
            <circle cx="16" cy="14" r="2.5" fill="white"/>
            <path d="M11,18 L7,23 L11,22Z" fill="#818cf8"/>
            <path d="M21,18 L25,23 L21,22Z" fill="#818cf8"/>
            <path d="M14,24 L16,28 L18,24Z" fill="#a78bfa"/>
            <path d="M27,4 L28,6.5 L30,7 L28,7.5 L27,10 L26,7.5 L24,7 L26,6.5Z" fill="#a78bfa"/>
            <path d="M4,21 L4.7,22.5 L6,23 L4.7,23.5 L4,25 L3.3,23.5 L2,23 L3.3,22.5Z" fill="#c4b5fd"/>
          </svg>

          <h1 className="mt-6 font-heading text-2xl font-bold">
            Set up your account
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Choose a password so you can sign in anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-zinc-300"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="mt-1 block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="mt-1 block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-zinc-300"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="mt-1 block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Complete setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
