import { describe, it, expect } from "vitest";
import { extractSignals } from "./scrape";

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
});
