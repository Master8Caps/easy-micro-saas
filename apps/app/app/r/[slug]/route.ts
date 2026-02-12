import { type NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

function getDeviceType(ua: string): string {
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function appendUtmParams(url: string, link: Record<string, string>): string {
  const parsed = new URL(url);
  if (link.utm_source) parsed.searchParams.set("utm_source", link.utm_source);
  if (link.utm_medium) parsed.searchParams.set("utm_medium", link.utm_medium);
  if (link.utm_campaign) parsed.searchParams.set("utm_campaign", link.utm_campaign);
  if (link.utm_content) parsed.searchParams.set("utm_content", link.utm_content);
  if (link.utm_term) parsed.searchParams.set("utm_term", link.utm_term);
  return parsed.toString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  // Look up the link
  const { data: link, error } = await supabase
    .from("links")
    .select("id, destination_url, utm_source, utm_medium, utm_campaign, utm_content, utm_term")
    .eq("slug", slug)
    .single();

  if (error || !link) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    return NextResponse.redirect(appUrl, 302);
  }

  // Log the click (fire-and-forget — don't block the redirect)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ipHash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 16) : "";
  const userAgent = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer") ?? "";
  const country = request.headers.get("x-vercel-ip-country") ?? "";
  const deviceType = getDeviceType(userAgent);

  // Non-blocking insert — we don't await to keep redirect fast
  supabase.from("clicks").insert({
    link_id: link.id,
    user_agent: userAgent.slice(0, 500),
    referer: referer.slice(0, 500),
    ip_hash: ipHash,
    country,
    device_type: deviceType,
  }).then(() => {});

  // Build destination with UTM params
  const destination = appendUtmParams(link.destination_url, link);

  return NextResponse.redirect(destination, 302);
}
