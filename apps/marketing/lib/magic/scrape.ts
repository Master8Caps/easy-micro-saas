import type { BrandSignals } from "./types";

const UA =
  "Mozilla/5.0 (compatible; EMSBot/1.0; +https://easymicrosaas.com)";
const MAX_TEXT = 6000;
const TIMEOUT_MS = 8000;

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function abs(href: string | undefined, base: string): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
}

function metaContent(html: string, name: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1].trim() : undefined;
}

function ogContent(html: string, prop: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+property=["']${prop}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1].trim() : undefined;
}

export function extractSignals(html: string, url: string): BrandSignals {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const description =
    metaContent(html, "description") ?? ogContent(html, "og:description") ?? "";
  const ogImage = abs(ogContent(html, "og:image"), url);
  const themeColor = metaContent(html, "theme-color");
  const favMatch = html.match(
    /<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i,
  );
  const favicon = abs(favMatch ? favMatch[1] : undefined, url);

  const headings = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)]
    .map((m) => stripTags(m[1]))
    .filter(Boolean)
    .slice(0, 12);

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = stripTags(body).slice(0, MAX_TEXT);

  const thin = text.length < 200 && headings.length === 0;

  return {
    url,
    title,
    description,
    ogImage,
    themeColor,
    favicon,
    headings,
    text,
    thin,
  };
}

function emptySignals(url: string): BrandSignals {
  return {
    url,
    title: "",
    description: "",
    headings: [],
    text: "",
    thin: true,
  };
}

export async function fetchBrandSignals(url: string): Promise<BrandSignals> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return emptySignals(url);
    const html = await res.text();
    return extractSignals(html, url);
  } catch {
    return emptySignals(url);
  }
}
