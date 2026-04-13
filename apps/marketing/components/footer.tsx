import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <Link href="/" className="flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" className="shrink-0">
            <path d="M16,3 Q21,10 21,18 Q21,24 16,24 Q11,24 11,18 Q11,10 16,3Z" fill="#6366f1"/>
            <circle cx="16" cy="14" r="2.5" fill="white"/>
            <path d="M11,18 L7,23 L11,22Z" fill="#818cf8"/>
            <path d="M21,18 L25,23 L21,22Z" fill="#818cf8"/>
            <path d="M14,24 L16,28 L18,24Z" fill="#a78bfa"/>
            <path d="M27,4 L28,6.5 L30,7 L28,7.5 L27,10 L26,7.5 L24,7 L26,6.5Z" fill="#a78bfa"/>
            <path d="M4,21 L4.7,22.5 L6,23 L4.7,23.5 L4,25 L3.3,23.5 L2,23 L3.3,22.5Z" fill="#c4b5fd"/>
          </svg>
          <span className="text-sm font-medium text-zinc-500">
            Easy Micro SaaS
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-xs">
          <Link
            href="/blog"
            className="text-zinc-500 transition-colors hover:text-zinc-200"
          >
            Blog
          </Link>
          <span className="text-zinc-600">
            &copy; {new Date().getFullYear()} Easy Micro SaaS
          </span>
        </nav>
      </div>
    </footer>
  );
}
