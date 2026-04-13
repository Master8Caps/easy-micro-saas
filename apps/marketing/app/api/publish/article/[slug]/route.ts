import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/blog/auth";
import { blogSupabase } from "@/lib/blog/supabase";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { slug } = await params;

  const { data: existing } = await blogSupabase
    .from("blog_articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const { error } = await blogSupabase
    .from("blog_articles")
    .update({ published: false, updated_at: new Date().toISOString() })
    .eq("slug", slug);

  if (error) {
    console.error("Blog soft-delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, slug });
}
