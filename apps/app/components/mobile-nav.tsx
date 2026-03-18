"use client";

import Link from "next/link";

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
      <Link href="/" className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
          <path d="M16,3 Q21,10 21,18 Q21,24 16,24 Q11,24 11,18 Q11,10 16,3Z" fill="#6366f1"/>
          <circle cx="16" cy="14" r="2.5" fill="white"/>
          <path d="M11,18 L7,23 L11,22Z" fill="#818cf8"/>
          <path d="M21,18 L25,23 L21,22Z" fill="#818cf8"/>
          <path d="M14,24 L16,28 L18,24Z" fill="#a78bfa"/>
          <path d="M27,4 L28,6.5 L30,7 L28,7.5 L27,10 L26,7.5 L24,7 L26,6.5Z" fill="#a78bfa"/>
          <path d="M4,21 L4.7,22.5 L6,23 L4.7,23.5 L4,25 L3.3,23.5 L2,23 L3.3,22.5Z" fill="#c4b5fd"/>
        </svg>
        <span className="font-heading text-sm font-semibold">Easy Micro SaaS</span>
      </Link>
    </div>
  );
}
