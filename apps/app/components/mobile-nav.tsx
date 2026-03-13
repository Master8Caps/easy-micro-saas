"use client";

interface MobileNavProps {
  onToggle: () => void;
}

export function MobileNav({ onToggle }: MobileNavProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 md:hidden">
      <button
        onClick={onToggle}
        aria-label="Toggle navigation"
        className="flex h-9 w-9 items-center justify-center rounded-md text-content-muted hover:bg-surface-hover hover:text-content"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
      <a href="/" className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#logo-grad-mobile)" />
          <path d="M9 16.5L14 21.5L23 10.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="logo-grad-mobile" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#6366f1" />
              <stop offset="0.5" stopColor="#a855f7" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-heading text-sm font-semibold">Easy Micro SaaS</span>
      </a>
    </div>
  );
}
