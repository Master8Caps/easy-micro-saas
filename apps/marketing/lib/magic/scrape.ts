import type { BrandSignals } from "./types";

// A real browser UA + headers gets us past UA-only bot filters. (Deep WAFs that
// fingerprint TLS still block us — that's what the reader fallback is for.)
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MAX_TEXT = 6000;
const DIRECT_TIMEOUT_MS = 10000;
const READER_TIMEOUT_MS = 15000;
// Jina Reader: renders JS + bypasses most bot-walls server-side. Free, no key
// required; set JINA_API_KEY for higher limits / better rendering.
const READER_BASE = "https://r.jina.ai/";

// Titles served by bot-walls, captchas and error pages — never real content.
const BLOCKED_TITLE =
  /access denied|just a moment|attention required|forbidden|are you (a )?human|verify you are|error 40|error 50|service unavailable|captcha|cloudflare/i;

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

function findLogo(html: string): string | undefined {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const wanted of ["apple-touch-icon", "apple-touch-icon-precomposed"]) {
    for (const tag of links) {
      if (attr(tag, "rel")?.toLowerCase() === wanted) {
        const href = attr(tag, "href");
        if (href) return href;
      }
    }
  }
  // og:logo as a fallback (never og:image).
  return ogContent(html, "og:logo");
}

/** A title is usable signal if it's descriptive and not a bot-wall/error page. */
function usableTitle(title: string): boolean {
  const t = title.trim();
  return t.length >= 5 && !BLOCKED_TITLE.test(t);
}

/**
 * "Thin" means we got too little to infer a brand and should ask the owner for
 * a one-line description. A usable title, a meta description, any headings, or a
 * real chunk of body text are each enough on their own — so JS-only sites that
 * only render <head> still generate fine.
 */
function isThin(
  title: string,
  description: string,
  headings: string[],
  text: string,
): boolean {
  if (usableTitle(title)) return false;
  if (description.trim().length > 0) return false;
  if (headings.length > 0) return false;
  if (text.length >= 200) return false;
  return true;
}

export function extractSignals(html: string, url: string): BrandSignals {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const description =
    metaContent(html, "description") ?? ogContent(html, "og:description") ?? "";
  const ogImage = abs(ogContent(html, "og:image"), url);
  const themeColor = metaContent(html, "theme-color");
  const favicon = abs(findFavicon(html), url);
  const logoUrl = abs(findLogo(html), url) ?? favicon;

  const headings = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)]
    .map((m) => stripTags(m[1]))
    .filter(Boolean)
    .slice(0, 12);

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = stripTags(body).slice(0, MAX_TEXT);

  const thin = isThin(title, description, headings, text);

  return {
    url,
    title,
    description,
    ogImage,
    logoUrl,
    themeColor,
    favicon,
    headings,
    text,
    thin,
  };
}

/** Parse Jina Reader's markdown output into signals. */
export function extractReaderSignals(raw: string, url: string): BrandSignals {
  const titleMatch = raw.match(/^Title:\s*(.+)$/m);
  const rawTitle = titleMatch ? titleMatch[1].trim() : "";

  const idx = raw.indexOf("Markdown Content:");
  const content = idx >= 0 ? raw.slice(idx + "Markdown Content:".length) : raw;

  const headings = [...content.matchAll(/^#{1,6}\s+(.+)$/gm)]
    .map((m) => m[1].replace(/[#*_`>[\]]/g, "").trim())
    .filter(Boolean)
    .slice(0, 12);

  const text = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → label
    .replace(/[#*_`>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT);

  // Jina returns 200 even when the upstream blocked it — detect that.
  const upstreamErrored = /returned error \d|Access Denied|Forbidden/i.test(raw);
  const title = usableTitle(rawTitle) ? rawTitle : "";

  const thin =
    (upstreamErrored && text.length < 200) ||
    isThin(title, "", headings, text);

  return { url, title, description: "", headings, text, thin };
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

async function fetchDirect(url: string): Promise<BrandSignals> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DIRECT_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return emptySignals(url);
    const html = await res.text();
    return extractSignals(html, url);
  } catch {
    return emptySignals(url);
  }
}

async function fetchViaReader(url: string): Promise<BrandSignals | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), READER_TIMEOUT_MS);
    const headers: Record<string, string> = {
      Accept: "text/plain",
      "X-Return-Format": "markdown",
    };
    if (process.env.JINA_API_KEY) {
      headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
    }
    const res = await fetch(READER_BASE + url, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const raw = await res.text();
    return extractReaderSignals(raw, url);
  } catch {
    return null;
  }
}

/**
 * Fetch brand signals for a URL. Tries a direct fetch first (fast, works for
 * most server-rendered sites); if that's blocked, empty, or a JS-only shell,
 * falls back to the reader and merges its content with any metadata (OG image,
 * theme colour) we did manage to scrape directly.
 */
export async function fetchBrandSignals(url: string): Promise<BrandSignals> {
  const direct = await fetchDirect(url);
  if (!direct.thin) return direct;

  const reader = await fetchViaReader(url);
  if (reader && !reader.thin) {
    return {
      url,
      title: usableTitle(direct.title) ? direct.title : reader.title,
      description: direct.description || reader.description,
      ogImage: direct.ogImage,
      logoUrl: direct.logoUrl,
      themeColor: direct.themeColor,
      favicon: direct.favicon,
      headings: reader.headings.length ? reader.headings : direct.headings,
      text: reader.text || direct.text,
      thin: false,
    };
  }

  return direct; // both failed → thin → route asks for a one-line description
}
