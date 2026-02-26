import { createClient } from "@/lib/supabase/server";
import { ScheduleCalendar } from "./schedule-calendar";

function getWeekRange(offset: number) {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    startDate: monday.toISOString().split("T")[0],
    endDate: `${sunday.toISOString().split("T")[0]}T23:59:59.999Z`,
  };
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const weekOffset = parseInt(params.week || "0", 10);
  const { startDate, endDate } = getWeekRange(weekOffset);

  // Fetch scheduled content for the week
  const { data: scheduledPieces } = await supabase
    .from("content_pieces")
    .select(
      "id, product_id, campaign_id, type, title, body, status, posted_at, scheduled_for, archived, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at, products(name), campaigns(channel, angle)",
    )
    .gte("scheduled_for", startDate)
    .lte("scheduled_for", endDate)
    .eq("archived", false)
    .order("scheduled_for", { ascending: true });

  // Fetch unscheduled active content (limit 50 most recent)
  const { data: unscheduledPieces } = await supabase
    .from("content_pieces")
    .select(
      "id, product_id, campaign_id, type, title, body, status, posted_at, scheduled_for, archived, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at, products(name), campaigns(channel, angle)",
    )
    .is("scheduled_for", null)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(50);

  // Products for filter dropdown
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .order("name");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Plan your content calendar week by week.
        </p>
      </div>

      <ScheduleCalendar
        scheduledPieces={(scheduledPieces ?? []) as any}
        unscheduledPieces={(unscheduledPieces ?? []) as any}
        products={(products ?? []) as { id: string; name: string }[]}
        weekOffset={weekOffset}
      />
    </>
  );
}
