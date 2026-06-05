const DAILY_CAP = 20;
const buckets = new Map<string, { count: number; day: string }>();

/** Returns true if this IP is over the daily cap. */
export function isRateLimited(ip: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const entry = buckets.get(ip);
  if (!entry || entry.day !== day) {
    buckets.set(ip, { count: 1, day });
    return false;
  }
  entry.count += 1;
  return entry.count > DAILY_CAP;
}
