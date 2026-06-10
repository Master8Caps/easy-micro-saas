import { describe, it, expect, vi, afterEach } from "vitest";
import { extractSignals, fetchBrandSignals } from "./scrape";

afterEach(() => vi.unstubAllGlobals());

const RICH = `
<html><head>
  <title>Northwind — calm productivity</title>
  <meta name="description" content="Reclaim your weekends.">
  <meta property="og:image" content="/logo.png">
  <meta name="theme-color" content="#10b981">
  <link rel="icon" href="/favicon.ico">
</head><body>
  <h1>Work less, live more</h1>
  <h2>Built for busy founders</h2>
  <script>var x = 1;</script>
  <p>Northwind helps you automate the boring parts of running a business.</p>
</body></html>`;

describe("extractSignals", () => {
  it("pulls title, description, og:image, theme-color, favicon", () => {
    const s = extractSignals(RICH, "https://northwind.com");
    expect(s.title).toBe("Northwind — calm productivity");
    expect(s.description).toBe("Reclaim your weekends.");
    expect(s.ogImage).toBe("https://northwind.com/logo.png");
    expect(s.themeColor).toBe("#10b981");
    expect(s.favicon).toBe("https://northwind.com/favicon.ico");
  });
  it("collects headings and strips scripts from text", () => {
    const s = extractSignals(RICH, "https://northwind.com");
    expect(s.headings).toContain("Work less, live more");
    expect(s.text).not.toContain("var x");
    expect(s.thin).toBe(false);
  });
  it("flags thin pages", () => {
    const s = extractSignals("<html><body></body></html>", "https://x.com");
    expect(s.thin).toBe(true);
  });
  it("treats a JS shell with a real title + description as usable (not thin)", () => {
    // Client-rendered SPA: empty body, but head has solid signals.
    const shell = `<html><head>
      <title>Acme Plumbing — Emergency plumbers in Leeds</title>
      <meta name="description" content="24/7 emergency plumbing across Leeds & West Yorkshire.">
    </head><body><div id="root"></div></body></html>`;
    const s = extractSignals(shell, "https://acme.example");
    expect(s.thin).toBe(false);
    expect(s.title).toContain("Acme Plumbing");
    expect(s.description).toContain("emergency plumbing");
  });
  it("treats a bot-wall / challenge title as thin", () => {
    const wall = `<html><head><title>Just a moment...</title></head><body></body></html>`;
    const s = extractSignals(wall, "https://x.com");
    expect(s.thin).toBe(true);
  });
  it("extracts meta/og/link regardless of attribute order", () => {
    const html = `<html><head>
      <meta content="Swapped desc" name="description">
      <meta content="/img.png" property="og:image">
      <link href="/fav.ico" rel="icon">
    </head><body><h1>Hi there friend</h1></body></html>`;
    const s = extractSignals(html, "https://x.com");
    expect(s.description).toBe("Swapped desc");
    expect(s.ogImage).toBe("https://x.com/img.png");
    expect(s.favicon).toBe("https://x.com/fav.ico");
  });

  it("prefers apple-touch-icon as the logo over og:image", () => {
    const html = `<html><head>
      <title>Acme Ltd — tools for makers</title>
      <meta property="og:image" content="/og-banner.png">
      <link rel="apple-touch-icon" href="/touch-icon.png">
      <link rel="icon" href="/favicon.ico">
    </head><body><h1>Hello makers everywhere</h1></body></html>`;
    const s = extractSignals(html, "https://acme.example");
    expect(s.logoUrl).toBe("https://acme.example/touch-icon.png");
    expect(s.ogImage).toBe("https://acme.example/og-banner.png");
  });

  it("falls back to og:logo for the logo, never og:image", () => {
    const onlyOg = `<html><head>
      <title>Beta Co — widgets</title>
      <meta property="og:image" content="/og.png">
    </head><body><h1>Widgets for everyone here</h1></body></html>`;
    const s = extractSignals(onlyOg, "https://beta.example");
    expect(s.logoUrl).toBeUndefined();
    expect(s.ogImage).toBe("https://beta.example/og.png");

    const withOgLogo = `<html><head>
      <title>Beta Co — widgets</title>
      <meta property="og:logo" content="/brand.svg">
      <meta property="og:image" content="/og.png">
    </head><body><h1>Widgets for everyone here</h1></body></html>`;
    const s2 = extractSignals(withOgLogo, "https://beta.example");
    expect(s2.logoUrl).toBe("https://beta.example/brand.svg");
  });

  it("populates palette from inline <style> and theme-color", () => {
    const html = `<html><head>
      <title>Teal Co — calm tools for teams</title>
      <meta name="theme-color" content="#0d9488">
      <style>:root{--brand:#155e75}.btn{background:#0d9488}</style>
    </head><body><h1>Calm tools for busy teams</h1></body></html>`;
    const s = extractSignals(html, "https://teal.example");
    expect(s.palette).toContain("#0d9488");
    expect(s.palette).toContain("#155e75");
  });
});

describe("fetchBrandSignals", () => {
  it("returns thin signals on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const s = await fetchBrandSignals("https://x.com");
    expect(s.thin).toBe(true);
  });
  it("returns thin signals when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const s = await fetchBrandSignals("https://x.com");
    expect(s.thin).toBe(true);
  });
  it("parses a successful response", async () => {
    const html = `<html><head><title>Hi</title></head><body><h1>Welcome aboard everyone</h1><p>Lots of lovely descriptive text here, long enough to clear the threshold and prove parsing works.</p></body></html>`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(html) }));
    const s = await fetchBrandSignals("https://x.com");
    expect(s.title).toBe("Hi");
    expect(s.thin).toBe(false);
  });
  it("falls back to the reader when the direct fetch is blocked", async () => {
    const reader = `Title: Tesla Cars
URL Source: https://x.com
Markdown Content:
# Electric cars for everyone
Lots of descriptive reader content here, easily long enough to clear the threshold and prove the fallback path works end to end.`;
    vi.stubGlobal(
      "fetch",
      vi.fn((u: string) =>
        String(u).includes("r.jina.ai")
          ? Promise.resolve({ ok: true, text: () => Promise.resolve(reader) })
          : Promise.resolve({ ok: false, status: 403 }),
      ),
    );
    const s = await fetchBrandSignals("https://x.com");
    expect(s.thin).toBe(false);
    expect(s.title).toBe("Tesla Cars");
    expect(s.headings).toContain("Electric cars for everyone");
  });
  it("stays thin when both the direct fetch and the reader fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const s = await fetchBrandSignals("https://x.com");
    expect(s.thin).toBe(true);
  });
  it("enriches palette by fetching a linked stylesheet", async () => {
    const html = `<html><head>
      <title>Teal Co — calm tools for teams</title>
      <link rel="stylesheet" href="/styles.css">
    </head><body><h1>Calm tools for busy teams</h1>
      <p>Plenty of body copy here, long enough to clear the thin threshold easily.</p>
    </body></html>`;
    const cssText = `:root{--primary:#0d9488;--accent:#f97316}`;
    vi.stubGlobal(
      "fetch",
      vi.fn((u: string) =>
        String(u).endsWith("/styles.css")
          ? Promise.resolve({ ok: true, text: () => Promise.resolve(cssText) })
          : Promise.resolve({ ok: true, text: () => Promise.resolve(html) }),
      ),
    );
    const s = await fetchBrandSignals("https://teal.example");
    expect(s.palette).toContain("#0d9488");
    expect(s.palette).toContain("#f97316");
  });

  it("keeps the directly-scraped logo when falling back to the reader", async () => {
    const html = `<html><head><title>x</title><link rel="apple-touch-icon" href="/logo.png"></head><body></body></html>`;
    const reader = `Title: Real Brand Title\nMarkdown Content:\n# Big heading here\nLots of descriptive reader content here, easily long enough to clear the thin threshold and prove the merge path keeps the logo.`;
    vi.stubGlobal(
      "fetch",
      vi.fn((u: string) =>
        String(u).includes("r.jina.ai")
          ? Promise.resolve({ ok: true, text: () => Promise.resolve(reader) })
          : Promise.resolve({ ok: true, text: () => Promise.resolve(html) }),
      ),
    );
    const s = await fetchBrandSignals("https://x.com");
    expect(s.thin).toBe(false);
    expect(s.logoUrl).toBe("https://x.com/logo.png");
  });
});
