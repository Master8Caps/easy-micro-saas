// Pure colour extraction from CSS/HTML text. No network, no dependencies.

const MAX_COLORS = 5;

// CSS custom properties whose name looks brand-defining.
const BRAND_VAR =
  /--(?![\w-]*(?:text|background|bg|border|shadow|placeholder|disabled|error|success|warning|info|hover|focus|active|visited|link|muted|ring|outline)[\w-]*\s*:)[\w-]*(primary|brand|accent|secondary|theme|colou?r|main)[\w-]*\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/gi;
const HEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
const RGB = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, n));
}

function toHex(n: number): string {
  return clamp255(n).toString(16).padStart(2, "0");
}

/** Normalise a raw hex/rgb value to a 6-digit lowercase hex, or null if invalid. */
export function normaliseColor(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  const rgb = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgb) return `#${toHex(+rgb[1])}${toHex(+rgb[2])}${toHex(+rgb[3])}`;
  const hex = v.match(/^#([0-9a-f]{3,8})$/);
  if (!hex) return null;
  let h = hex[1];
  if (h.length === 4) h = h.slice(0, 3); // #rgba → #rgb
  if (h.length === 8) h = h.slice(0, 6); // #rrggbbaa → #rrggbb
  if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  if (h.length === 6) return `#${h}`;
  return null; // 5 or 7 digits are invalid
}

/** True for near-white, near-black, or low-saturation greys — brand noise. */
export function isNeutral(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255) || 1);
  if (lightness > 0.93 || lightness < 0.07) return true; // near white/black
  if (sat < 0.12) return true; // grey
  return false;
}

/**
 * Extract brand colours from CSS (or any text containing CSS).
 * Declared brand custom-properties rank first, then accents by frequency.
 * Near-white/black/grey are dropped (unless nothing else is found).
 */
export function extractColors(css: string): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const c = normaliseColor(raw);
    if (!c || seen.has(c)) return;
    seen.add(c);
    ordered.push(c);
  };

  // 1. Declared brand custom-properties (in source order).
  for (const m of css.matchAll(BRAND_VAR)) push(m[2]);

  // 2. Everything else, ranked by frequency.
  const counts = new Map<string, number>();
  const bump = (raw: string) => {
    const c = normaliseColor(raw);
    if (!c) return;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  };
  for (const m of css.matchAll(HEX)) bump(m[0]);
  for (const m of css.matchAll(RGB)) bump(`rgb(${m[1]},${m[2]},${m[3]})`);

  const byFreq = [...counts.entries()]
    .filter(([c]) => !seen.has(c))
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
  for (const c of byFreq) push(c);

  // Drop neutrals, but keep them if that would empty the list.
  const branded = ordered.filter((c) => !isNeutral(c));
  return (branded.length ? branded : ordered).slice(0, MAX_COLORS);
}
