import { calmHome } from "@/content/home.calm";

export function CalmFooter() {
  return (
    <footer className="bg-ink px-6 py-8 text-center text-xs text-sage">
      🌲 Taiga · {calmHome.footer.tagline} · {calmHome.footer.domain}
    </footer>
  );
}
