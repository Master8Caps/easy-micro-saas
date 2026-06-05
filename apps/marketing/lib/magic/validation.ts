import { isIP } from "node:net";

/**
 * Blocks SSRF targets: loopback, private RFC-1918, link-local + cloud metadata
 * (169.254.0.0/16, incl. AWS/GCP 169.254.169.254), and known metadata hostnames.
 * The WHATWG URL parser normalises hex/octal/decimal IPv4 to dotted form before
 * this runs, so those encodings are covered. NOTE (residual risk, v1): a public
 * host that HTTP-redirects to an internal IP is NOT covered here — harden with
 * per-hop revalidation before scaling.
 */
export function isBlockedHost(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "metadata.google.internal") return true;

  const v = isIP(h);
  if (v === 4) {
    const [a, b] = h.split(".").map(Number);
    if (a === 0 || a === 127 || a === 10) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  }
  if (v === 6) {
    if (h === "::1") return true;
    if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
    if (h.startsWith("::ffff:")) {
      const mapped = h.slice(7);
      if (isIP(mapped) === 4) return isBlockedHost(mapped);
    }
    return false;
  }
  return false; // ordinary domain name — allowed
}

export function normaliseUrl(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!u.hostname.includes(".")) return null;
    if (isBlockedHost(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
