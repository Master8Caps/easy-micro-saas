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
          <span className="font-medium text-content-primary">{user.email}</span>{" "}
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

        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
