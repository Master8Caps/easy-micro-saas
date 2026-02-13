import { redirect } from "next/navigation";
import { requireAuth, getUserWithRole } from "@/server/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function WaitlistPage() {
  const user = await requireAuth();
  const { status } = await getUserWithRole();

  if (status !== "waitlist") {
    redirect("/");
  }

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
          <span className="font-medium text-zinc-200">{user.email}</span>{" "}
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

        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
