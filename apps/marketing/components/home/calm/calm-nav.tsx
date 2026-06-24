import Link from "next/link";
import { calmHome } from "@/content/home.calm";

export function CalmNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/[0.06] bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-heading text-xl text-ink">🌲 Taiga</span>
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="#how" className="hidden transition-colors hover:text-ink sm:inline">{calmHome.nav.links[0]}</Link>
          <Link href="#pricing" className="hidden transition-colors hover:text-ink sm:inline">{calmHome.nav.links[1]}</Link>
          <Link href="/blog" className="hidden transition-colors hover:text-ink sm:inline">{calmHome.nav.links[2]}</Link>
          <Link href="/start" className="rounded-full bg-primary px-4 py-2 text-paper">{calmHome.nav.cta}</Link>
        </div>
      </nav>
    </header>
  );
}
