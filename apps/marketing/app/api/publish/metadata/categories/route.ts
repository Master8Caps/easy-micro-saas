import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/blog/auth";
import { blogSupabase } from "@/lib/blog/supabase";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { data, error } = await blogSupabase
    .from("blog_categories")
    .select("slug, name")
    .order("name");

  if (error) {
    console.error("Blog metadata categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ categories: data ?? [] });
}
