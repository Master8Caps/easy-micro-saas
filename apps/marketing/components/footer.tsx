export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" className="shrink-0">
            <defs>
              <linearGradient id="footer-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#footer-g)"/>
            <path d="M10 10h12M10 16h9M10 22h12M10 10v12" stroke="#18181b" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="text-sm font-medium text-zinc-500">
            Easy Micro SaaS
          </span>
        </div>
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} Easy Micro SaaS
        </p>
      </div>
    </footer>
  );
}
