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

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1].trim() : undefined;
}

function findMetaContent(
  html: string,
  key: "name" | "property",
  value: string,
): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const k = attr(tag, key);
    if (k && k.toLowerCase() === value.toLowerCase()) {
      const content = attr(tag, "content");
      if (content !== undefined) return content;
    }
  }
  return undefined;
}

function metaContent(html: string, name: string): string | undefined {
  return findMetaContent(html, "name", name);
}

function ogContent(html: string, prop: string): string | undefined {
  return findMetaContent(html, "property", prop);
}

function findFavicon(html: string): string | undefined {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const rel = attr(tag, "rel")?.toLowerCase();
    if (rel && ["icon", "shortcut icon", "apple-touch-icon"].includes(rel)) {
      const href = attr(tag, "href");
      if (href) return href;
    }
  }
  return undefined;
}

export function extractSignals(html: string, url: string): BrandSignals {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const description =
    metaContent(html, "description") ?? ogContent(html, "og:description") ?? "";
  const ogImage = abs(ogContent(html, "og:image"), url);
  const themeColor = metaContent(html, "theme-color");
  const favicon = abs(findFavicon(html), url);

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
