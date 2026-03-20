// apps/app/lib/metricool/publish.ts

import { schedulePost, normalizeImageUrl, getBestTimeToPost } from "./client";
import type { SchedulePostResponse, BestTimeSlot } from "./types";
import { CONTENT_TYPE_TO_NETWORK } from "./types";

export function getDefaultNetwork(contentType: string): string | null {
  return CONTENT_TYPE_TO_NETWORK[contentType] ?? null;
}

export async function publishToMetricool(opts: {
  text: string;
  networks: string[];
  scheduledAt: string;
  imageUrl?: string | null;
}): Promise<SchedulePostResponse> {
  let mediaUrls: string[] = [];

  if (opts.imageUrl) {
    const normalized = await normalizeImageUrl(opts.imageUrl);
    mediaUrls = [normalized];
  }

  return schedulePost({
    networks: opts.networks,
    text: opts.text,
    scheduledAt: opts.scheduledAt,
    mediaUrls,
  });
}

export async function fetchBestTimes(network: string): Promise<BestTimeSlot[]> {
  return getBestTimeToPost(network);
}
