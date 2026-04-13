import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/blog/auth";
import { BLOG_CONTEXT } from "@/lib/blog/context";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  return NextResponse.json({ context: BLOG_CONTEXT });
}
