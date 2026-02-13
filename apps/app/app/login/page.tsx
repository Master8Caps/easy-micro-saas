"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addToWaitlist } from "@/server/actions/waitlist";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [waitlisted, setWaitlisted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      await addToWaitlist(email);
      setLoading(false);
      setWaitlisted(true);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setWaitlisted(false);
    setEmail("");
    setPassword("");
    setMode("login");
  }

  if (waitlisted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 32 32"
            className="mx-auto"
          >
            <defs>
              <linearGradient id="wl-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path
              d="M3 26V6l6.5 14L16 6l6.5 14L29 6v20"
              fill="none"
              stroke="url(#wl-g)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <h1 className="mt-6 font-heading text-2xl font-bold">
            You&apos;re on the list
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Early access is opening soon. We&apos;ve saved your spot and
            will email you at{" "}
            <span className="font-medium text-zinc-200">{email}</span>{" "}
            as soon as your account is ready.
          </p>

          <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              What happens next?
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              We&apos;re onboarding users in small batches to ensure the best
              experience. You&apos;ll receive an email when your account is
              activated.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-8 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {mode === "login"
              ? "Enter your credentials to access the dashboard."
              : "Create an account to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {mode === "login" ? (
            <>
              No account?{" "}
              <button
                onClick={() => { setMode("signup"); setError(""); }}
                className="text-zinc-300 underline hover:text-zinc-100"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className="text-zinc-300 underline hover:text-zinc-100"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
