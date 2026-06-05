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
});
