// apps/app/lib/metricool/client.ts

import type {
  SchedulePostParams,
  SchedulePostResponse,
  BestTimeSlot,
  PlatformAnalytics,
  PostPerformance,
  AnalyticsRequest,
  MetricoolBrand,
} from "./types";

const BASE_URL = "https://app.metricool.com/api";

function getConfig() {
  const token = process.env.METRICOOL_API_TOKEN;
  const userId = process.env.METRICOOL_USER_ID;
  const blogId = process.env.METRICOOL_BLOG_ID;
  if (!token || !userId || !blogId) {
    throw new Error("Missing Metricool env vars (METRICOOL_API_TOKEN, METRICOOL_USER_ID, METRICOOL_BLOG_ID)");
  }
  return { token, userId, blogId };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { token, userId, blogId } = getConfig();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${path}${separator}userId=${userId}&blogId=${blogId}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Mc-Auth": token,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Metricool API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Publishing ─────────────────────────────────────

export async function schedulePost(
  params: SchedulePostParams,
): Promise<SchedulePostResponse> {
  return request<SchedulePostResponse>("/schedule/post", {
    method: "POST",
    body: JSON.stringify({
      networks: params.networks,
      text: params.text,
      scheduledAt: params.scheduledAt,
      mediaUrls: params.mediaUrls ?? [],
    }),
  });
}

export async function getScheduledPosts(): Promise<unknown[]> {
  return request<unknown[]>("/schedule/posts");
}

export async function updateScheduledPost(
  postId: string,
  params: Partial<SchedulePostParams>,
): Promise<void> {
  await request(`/schedule/post/${postId}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}

export async function getBestTimeToPost(
  network: string,
): Promise<BestTimeSlot[]> {
  return request<BestTimeSlot[]>(`/schedule/besttime?network=${network}`);
}

export async function normalizeImageUrl(imageUrl: string): Promise<string> {
  const result = await request<{ url: string }>("/actions/normalize/image/url", {
    method: "POST",
    body: JSON.stringify({ url: imageUrl }),
  });
  return result.url;
}

// ── Analytics ──────────────────────────────────────

export async function getAnalytics(
  params: AnalyticsRequest,
): Promise<PlatformAnalytics> {
  return request<PlatformAnalytics>(
    `/analytics/${params.network}?init_date=${params.initDate}&end_date=${params.endDate}`,
  );
}

export async function getPostPerformance(
  network: string,
  initDate: string,
  endDate: string,
): Promise<PostPerformance[]> {
  return request<PostPerformance[]>(
    `/analytics/${network}/posts?init_date=${initDate}&end_date=${endDate}`,
  );
}

export async function getMetrics(network: string): Promise<unknown[]> {
  return request<unknown[]>(`/analytics/${network}/metrics`);
}

// ── Brands ─────────────────────────────────────────

export async function getBrands(): Promise<MetricoolBrand[]> {
  return request<MetricoolBrand[]>("/admin/simpleProfiles");
}
