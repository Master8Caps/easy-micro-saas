import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WaitlistButton } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Get started — Easy Micro SaaS",
  description:
    "Start your marketing engine for £49.95/mo. Sign-up opening soon — join the list to be first in.",
};

// Placeholder signup page. Hero + pricing CTAs point here while the real
// signup + Stripe payment-link flow is built (see docs/native.md, Stage 3).
export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[70vh] items-center justify-center px-6 py-32">
        {/* Background atmosphere */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.07] blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse-glow" />
            <span className="text-xs font-medium tracking-wide text-zinc-400">
              £49.95/mo · Everything included
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            Sign-up is{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              opening soon.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-zinc-400">
            We&apos;re putting the finishing touches on the signup flow. Join the
            list and you&apos;ll be first in when it opens — plus we&apos;ll send
            your free brand DNA.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <WaitlistButton source="signup" label="Join the list" />
            <p className="text-sm text-zinc-500">
              No card required · Free brand DNA & avatars
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
