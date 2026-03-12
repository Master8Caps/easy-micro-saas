"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { dismissOnboarding } from "@/lib/actions/onboarding";

interface OnboardingChecklistProps {
  completedSteps: string[];
}

const STEPS = [
  {
    key: "account",
    title: "Create your account",
    description: "You're in! Your account is ready to go.",
    href: null,
  },
  {
    key: "profile",
    title: "Complete your profile",
    description: "Add your name to personalize your experience.",
    href: "/settings",
  },
  {
    key: "product",
    title: "Create your first product",
    description: "Tell us about what you're building.",
    href: "/products/new",
  },
  {
    key: "brain",
    title: "Generate your brand brain",
    description: "Let AI learn your brand voice and audience.",
    href: null,
  },
  {
    key: "campaigns",
    title: "Review your campaigns",
    description: "See AI-generated campaign angles for your product.",
    href: "/campaigns",
  },
  {
    key: "schedule",
    title: "Schedule your first content",
    description: "Put your content on the calendar and start posting.",
    href: "/schedule",
  },
];

export function OnboardingChecklist({ completedSteps }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const completed = STEPS.filter((s) => completedSteps.includes(s.key)).length;
  const total = STEPS.length;
  const allDone = completed === total;
  const progress = (completed / total) * 100;

  useEffect(() => {
    if (allDone && !celebrated) {
      setCelebrated(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [allDone, celebrated]);

  if (dismissed) return null;

  const handleDismiss = async () => {
    setDismissed(true);
    await dismissOnboarding();
  };

  return (
    <div className="rounded-xl border border-line bg-surface-card p-6 mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-heading font-semibold text-content-primary">
            {allDone ? "You're all set!" : "Getting started"}
          </h2>
          <p className="text-sm text-content-muted mt-0.5">
            {allDone
              ? "You've completed all the setup steps. Welcome aboard!"
              : `${completed} of ${total} steps complete`}
          </p>
        </div>
        {allDone && (
          <button
            onClick={handleDismiss}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-surface-tertiary mb-6 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const isDone = completedSteps.includes(step.key);
          const content = (
            <div
              className={`flex items-center gap-4 rounded-lg px-4 py-3 transition-colors ${
                isDone
                  ? "opacity-60"
                  : "hover:bg-surface-card-hover"
              }`}
            >
              {/* Checkbox circle */}
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? "border-indigo-500 bg-indigo-500"
                    : "border-content-muted"
                }`}
              >
                {isDone && (
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>

              <div>
                <p className={`text-sm font-medium ${isDone ? "text-content-muted line-through" : "text-content-primary"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-content-muted">{step.description}</p>
              </div>
            </div>
          );

          if (step.href && !isDone) {
            return (
              <Link key={step.key} href={step.href}>
                {content}
              </Link>
            );
          }

          return <div key={step.key}>{content}</div>;
        })}
      </div>
    </div>
  );
}
