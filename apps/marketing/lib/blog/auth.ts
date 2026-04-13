import { NextResponse } from "next/server";

export function requireApiKey(request: Request): NextResponse | null {
  const headerKey = request.headers.get("x-api-key");
  const expected = process.env.BLOG_PUBLISH_API_KEY;

  if (!expected || !headerKey || headerKey !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
