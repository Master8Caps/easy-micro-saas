import { createClient } from "@/lib/supabase/server";
import { getUserWithRole } from "@/server/auth";
import { ScheduleCalendar, type SchedulePiece } from "./schedule-calendar";

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

function getMonthRange(monthParam: string | undefined) {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth(); // 0-indexed

  if (monthParam) {
    const [y, m] = monthParam.split("-").map(Number);
    if (y && m) {
      year = y;
      month = m - 1; // convert 1-indexed to 0-indexed
    }
  }

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // Extend to include full weeks (Monday start)
  const firstDay = first.getDay(); // 0=Sun
  const startPad = firstDay === 0 ? 6 : firstDay - 1;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startPad);

  const lastDay = last.getDay();
  const endPad = lastDay === 0 ? 0 : 7 - lastDay;
  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + endPad);

  return {
    startDate: gridStart.toISOString().split("T")[0],
    endDate: `${gridEnd.toISOString().split("T")[0]}T23:59:59.999Z`,
    year: first.getFullYear(),
    month: first.getMonth(), // 0-indexed
    label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; view?: string; month?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const view = params.view === "month" ? "month" : "week";
  const weekOffset = parseInt(params.week || "0", 10);

  // Determine date range based on view
  const weekRange = getWeekRange(weekOffset);
  const monthRange = view === "month" ? getMonthRange(params.month) : null;

  const startDate = view === "month" ? monthRange!.startDate : weekRange.startDate;
  const endDate = view === "month" ? monthRange!.endDate : weekRange.endDate;

  // Fetch scheduled content for the date range
  const { data: scheduledPieces } = await supabase
    .from("content_pieces")
    .select(
      "id, product_id, campaign_id, type, title, body, status, posted_at, scheduled_for, archived, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at, image_url, image_source, image_prompt_used, products(name), campaigns(channel, angle)",
    )
    .gte("scheduled_for", startDate)
    .lte("scheduled_for", endDate)
    .eq("archived", false)
    .order("scheduled_for", { ascending: true });

  // Fetch unscheduled active content (limit 50 most recent)
  const { data: unscheduledPieces } = await supabase
    .from("content_pieces")
    .select(
      "id, product_id, campaign_id, type, title, body, status, posted_at, scheduled_for, archived, rating, engagement_views, engagement_likes, engagement_comments, engagement_shares, engagement_logged_at, image_url, image_source, image_prompt_used, products(name), campaigns(channel, angle)",
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

  const { role } = await getUserWithRole();

  let metricoolPosts: any[] = [];
  if (role === "admin") {
    const { data } = await supabase
      .from("metricool_posts")
      .select("id, content_piece_id, platform, scheduled_at, posted_at, status")
      .in("status", ["scheduled", "posted"])
      .gte("scheduled_at", startDate)
      .lte("scheduled_at", endDate);
    metricoolPosts = data ?? [];
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="mt-1 text-sm text-content-muted">
          Plan and organise your content calendar.
        </p>
      </div>

      <ScheduleCalendar
        scheduledPieces={(scheduledPieces ?? []) as unknown as SchedulePiece[]}
        unscheduledPieces={(unscheduledPieces ?? []) as unknown as SchedulePiece[]}
        products={(products ?? []) as { id: string; name: string }[]}
        weekOffset={weekOffset}
        view={view}
        metricoolPosts={metricoolPosts}
        monthInfo={
          view === "month" && monthRange
            ? {
                year: monthRange.year,
                month: monthRange.month,
                label: monthRange.label,
                monthStr: `${monthRange.year}-${String(monthRange.month + 1).padStart(2, "0")}`,
              }
            : undefined
        }
      />
    </>
  );
}
