// apps/app/lib/metricool/analytics.ts

import { getAnalytics, getPostPerformance } from "./client";
import type { PlatformAnalytics, PostPerformance } from "./types";
import { ALL_NETWORKS } from "./types";

export async function fetchPlatformAnalytics(
  initDate: string,
  endDate: string,
): Promise<Record<string, PlatformAnalytics>> {
  const results: Record<string, PlatformAnalytics> = {};

  // Fetch in sequence to be conservative with rate limits
  for (const network of ALL_NETWORKS) {
    try {
      results[network] = await getAnalytics({ network, initDate, endDate });
    } catch {
      // Skip networks that error (may not be connected)
      continue;
    }
  }

  return results;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getDateRangeForDays(days: number): { initDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    initDate: formatDate(start),
    endDate: formatDate(end),
  };
}

export async function fetchPostPerformance(
  network: string,
  initDate: string,
  endDate: string,
): Promise<PostPerformance[]> {
  try {
    return await getPostPerformance(network, initDate, endDate);
  } catch {
    return [];
  }
}
