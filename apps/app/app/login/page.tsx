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
      try {
        await addToWaitlist(email);
      } catch {
        // Waitlist insert is best-effort — profile.status = 'waitlist' is the gate
      }
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
            You&apos;re on the list
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-content-secondary">
            Early access is opening soon. We&apos;ve saved your spot and
            will email you at{" "}
            <span className="font-medium text-content-primary">{email}</span>{" "}
            as soon as your account is ready.
          </p>

          <div className="mt-8 rounded-xl border border-line bg-surface-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-content-muted">
              What happens next?
            </p>
            <p className="mt-2 text-sm text-content-secondary">
              We&apos;re onboarding users in small batches to ensure the best
              experience. You&apos;ll receive an email when your account is
              activated.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-8 text-xs text-content-muted transition-colors hover:text-content-secondary"
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
          <p className="mt-2 text-sm text-content-secondary">
            {mode === "login"
              ? "Enter your credentials to access the dashboard."
              : "Create an account to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-content-secondary"
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
              className="mt-1 block w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-content-primary placeholder-content-muted focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-content-secondary"
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
              className="mt-1 block w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-content-primary placeholder-content-muted focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-content-primary px-4 py-2.5 text-sm font-medium text-surface-primary transition-colors hover:bg-surface-tertiary disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-content-muted">
          {mode === "login" ? (
            <>
              No account?{" "}
              <button
                onClick={() => { setMode("signup"); setError(""); }}
                className="text-content-secondary underline hover:text-content-primary"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className="text-content-secondary underline hover:text-content-primary"
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
