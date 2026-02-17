export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" className="shrink-0">
            <path d="M3,8 H9 M3,8 V24 M3,16 H8 M3,24 H9" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M12,24 V8 L16,14 L20,8 V24" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M27,9 C23,9 23,16 25,16 C27,16 27,23 23,23" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
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
