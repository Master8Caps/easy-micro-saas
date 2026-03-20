// apps/app/server/actions/metricool.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { publishToMetricool, fetchBestTimes } from "@/lib/metricool/publish";
import { fetchPlatformAnalytics, getDateRangeForDays } from "@/lib/metricool/analytics";
import type { BestTimeSlot } from "@/lib/metricool/types";

// ── Auth helper ────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const, user: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Admin access required" as const, user: null, supabase };
  }

  return { error: null, user, supabase };
}

// ── Publish a content piece via Metricool ──────────

export async function publishContentToMetricool(opts: {
  contentPieceId: string;
  networks: string[];
  scheduledAt: string;
}) {
  const { error, supabase } = await requireAdmin();
  if (error) return { error };

  // Fetch the content piece
  const { data: piece } = await supabase
    .from("content_pieces")
    .select("id, body, image_url, status")
    .eq("id", opts.contentPieceId)
    .single();

  if (!piece) return { error: "Content piece not found" };

  // Publish to Metricool
  let result;
  try {
    result = await publishToMetricool({
      text: piece.body,
      networks: opts.networks,
      scheduledAt: opts.scheduledAt,
      imageUrl: piece.image_url,
    });
  } catch (err) {
    return { error: `Metricool API error: ${err instanceof Error ? err.message : "Unknown error"}` };
  }

  // Create metricool_posts rows (one per network)
  const service = createServiceClient();
  const rows = opts.networks.map((network) => ({
    content_piece_id: opts.contentPieceId,
    metricool_post_id: result.id,
    platform: network.toLowerCase(),
    scheduled_at: opts.scheduledAt,
    status: "scheduled",
  }));

  const { error: insertError } = await service
    .from("metricool_posts")
    .insert(rows);

  if (insertError) return { error: insertError.message };

  // Update content piece status to scheduled
  await service
    .from("content_pieces")
    .update({ status: "scheduled", scheduled_for: opts.scheduledAt })
    .eq("id", opts.contentPieceId);

  revalidatePath("/content");
  revalidatePath("/schedule");
  return { success: true, metricoolPostId: result.id };
}

// ── Get best time to post ──────────────────────────

export async function getMetricoolBestTimes(
  network: string,
): Promise<{ error?: string; data?: BestTimeSlot[] }> {
  const { error } = await requireAdmin();
  if (error) return { error };

  try {
    const data = await fetchBestTimes(network);
    return { data };
  } catch (err) {
    return { error: `Failed to fetch best times: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

// ── Refresh analytics on demand ────────────────────

export async function refreshMetricoolAnalytics() {
  const { error } = await requireAdmin();
  if (error) return { error };

  const service = createServiceClient();
  const { initDate, endDate } = getDateRangeForDays(30);

  try {
    const analytics = await fetchPlatformAnalytics(initDate, endDate);

    for (const [network, data] of Object.entries(analytics)) {
      await service
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
  } catch (err) {
    return { error: `Sync failed: ${err instanceof Error ? err.message : "Unknown error"}` };
  }

  revalidatePath("/analytics");
  return { success: true };
}

// ── Get metricool posts for a content piece ────────

export async function getMetricoolPostsForContent(contentPieceId: string) {
  const { error, supabase } = await requireAdmin();
  if (error) return { error, data: null };

  const { data } = await supabase
    .from("metricool_posts")
    .select("*")
    .eq("content_piece_id", contentPieceId)
    .order("created_at", { ascending: false });

  return { data: data ?? [] };
}
