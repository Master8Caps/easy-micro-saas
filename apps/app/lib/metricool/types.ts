// apps/app/lib/metricool/types.ts

// ── Request types ──────────────────────────────────

export interface SchedulePostParams {
  networks: string[];          // e.g. ["LINKEDIN", "TWITTER"]
  text: string;
  scheduledAt: string;         // ISO 8601 datetime
  mediaUrls?: string[];        // normalized image URLs
}

export interface BestTimeRequest {
  network: string;             // e.g. "LINKEDIN"
}

export interface AnalyticsRequest {
  network: string;
  initDate: string;            // YYYY-MM-DD
  endDate: string;             // YYYY-MM-DD
}

// ── Response types ─────────────────────────────────

export interface SchedulePostResponse {
  id: string;                  // Metricool's post ID
  status: string;
}

export interface BestTimeSlot {
  day: number;                 // 0-6 (Sun-Sat)
  hour: number;                // 0-23
  score: number;
}

export interface PlatformAnalytics {
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  profileViews: number;
}

export interface PostPerformance {
  postId: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  shares: number;
}

export interface MetricoolBrand {
  blogId: string;
  name: string;
  networks: string[];
}

// ── Shared constants ───────────────────────────────

export const CONTENT_TYPE_TO_NETWORK: Record<string, string> = {
  "linkedin-post": "LINKEDIN",
  "twitter-post": "TWITTER",
  "twitter-thread": "TWITTER",
  "facebook-post": "FACEBOOK",
  "instagram-reel-caption": "INSTAGRAM",
  tiktok: "TIKTOK",
};

export const NETWORK_LABELS: Record<string, string> = {
  LINKEDIN: "LinkedIn",
  TWITTER: "X (Twitter)",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  THREADS: "Threads",
  BLUESKY: "Bluesky",
  PINTEREST: "Pinterest",
  YOUTUBE: "YouTube",
};

export const ALL_NETWORKS = Object.keys(NETWORK_LABELS);
