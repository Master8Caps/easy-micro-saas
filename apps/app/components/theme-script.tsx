import { SITE_VARIANT } from "@/lib/variant";

export function ThemeScript() {
  if (SITE_VARIANT === "calm") {
    // Calm is light-only — never apply the dark class.
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.remove('dark');`,
        }}
      />
    );
  }

  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('theme') || 'dark';
        var resolved = theme;
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
