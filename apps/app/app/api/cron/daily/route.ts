// apps/app/app/api/cron/daily/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchPlatformAnalytics, fetchPostPerformance, getDateRangeForDays } from "@/lib/metricool/analytics";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};
  const supabase = createServiceClient();

  // ── 1. Sync Metricool platform analytics ──────────
  if (process.env.METRICOOL_API_TOKEN) {
    try {
      const { initDate, endDate } = getDateRangeForDays(30);
      const analytics = await fetchPlatformAnalytics(initDate, endDate);

      for (const [network, data] of Object.entries(analytics)) {
        await supabase
          .from("metricool_analytics")
          .upsert(
            {
              platform: network.toLowerCase(),
              date: endDate,
              followers: data.followers,
              reach: data.reach,
              impressions: data.impressions,
              engagement: data.engagement,
              profile_views: data.profileViews,
            },
            { onConflict: "platform,date" },
          );
      }
      results.metricoolAnalytics = `Synced ${Object.keys(analytics).length} platforms`;
    } catch (err) {
      results.metricoolAnalytics = `Error: ${err instanceof Error ? err.message : "Unknown"}`;
    }

    // ── 2. Update metricool_posts statuses ────────────
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Mark scheduled posts whose scheduled_at has passed as "posted"
      const { data: updated } = await supabase
        .from("metricool_posts")
        .update({ status: "posted", posted_at: new Date().toISOString() })
        .eq("status", "scheduled")
        .lt("scheduled_at", new Date().toISOString())
        .select("id");

      results.metricoolPostUpdates = `Updated ${updated?.length ?? 0} posts to posted`;
    } catch (err) {
      results.metricoolPostUpdates = `Error: ${err instanceof Error ? err.message : "Unknown"}`;
    }

    // ── 3. Sync per-post performance metrics ──────────
    try {
      const { initDate, endDate } = getDateRangeForDays(30);

      // Get all posted metricool_posts from the last 30 days
      const { data: postedPosts } = await supabase
        .from("metricool_posts")
        .select("id, platform, metricool_post_id")
        .eq("status", "posted")
        .gte("posted_at", new Date(Date.now() - 30 * 86400_000).toISOString());

      if (postedPosts && postedPosts.length > 0) {
        // Get unique platforms
        const platforms = [...new Set(postedPosts.map((p) => p.platform))];
        let synced = 0;

        for (const platform of platforms) {
          const performances = await fetchPostPerformance(
            platform.toUpperCase(),
            initDate,
            endDate,
          );

          // Match Metricool post IDs to our rows and update
          for (const perf of performances) {
            const matchingPost = postedPosts.find(
              (p) => p.metricool_post_id === perf.postId,
            );
            if (matchingPost) {
              await supabase
                .from("metricool_posts")
                .update({
                  impressions: perf.impressions,
                  reach: perf.reach,
                  engagement: perf.engagement,
                  clicks: perf.clicks,
                  shares: perf.shares,
                  last_synced_at: new Date().toISOString(),
                })
                .eq("id", matchingPost.id);
              synced++;
            }
          }
        }
        results.metricoolPostPerformance = `Synced performance for ${synced} posts`;
      } else {
        results.metricoolPostPerformance = "No posted posts to sync";
      }
    } catch (err) {
      results.metricoolPostPerformance = `Error: ${err instanceof Error ? err.message : "Unknown"}`;
    }
  } else {
    results.metricoolAnalytics = "Skipped (no API token configured)";
  }

  // ── 4. Weekly digest (Mondays only) ────────────────
  const today = new Date();
  if (today.getDay() === 1) {
    try {
      // Dynamically import to avoid loading digest deps every day
      const { GET: digestHandler } = await import("../weekly-digest/route");
      // Call the existing digest handler directly
      // We pass the same request so it has the auth header
      const digestResponse = await digestHandler(request);
      const digestResult = await digestResponse.json();
      results.weeklyDigest = digestResult.error
        ? `Error: ${digestResult.error}`
        : `Sent ${digestResult.sent ?? 0} digests`;
    } catch (err) {
      results.weeklyDigest = `Error: ${err instanceof Error ? err.message : "Unknown"}`;
    }
  } else {
    results.weeklyDigest = "Skipped (not Monday)";
  }

  return NextResponse.json({ success: true, results });
}
