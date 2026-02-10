import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Log the click event (will be replaced with database insert)
  console.log(
    JSON.stringify({
      event: "redirect_click",
      slug,
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      timestamp: new Date().toISOString(),
    }),
  );

  // TODO: Look up destination URL from database by slug
  // For now, redirect to a mocked destination
  const destination = `https://example.com/landing?ref=${slug}`;

  return NextResponse.redirect(destination, 302);
}
