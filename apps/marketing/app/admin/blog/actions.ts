"use server";

import { revalidatePath } from "next/cache";
import { blogSupabase } from "@/lib/blog/supabase";

export type UpdateDateResult = { ok: boolean; error?: string };

/**
 * Update a blog post's published date. Gated by the existing blog publish API
 * key (entered on the admin page) so no new secret/auth system is needed.
 * Stores the date at noon UTC to keep the displayed calendar day stable across
 * timezones and avoid same-day ordering surprises.
 */
export async function updatePublishedDate(
  slug: string,
  date: string,
  key: string,
): Promise<UpdateDateResult> {
  const expected = process.env.BLOG_PUBLISH_API_KEY;
  if (!expected) {
    return { ok: false, error: "Server is missing BLOG_PUBLISH_API_KEY." };
  }
  if (!key || key !== expected) {
    return { ok: false, error: "Wrong key." };
  }

  // Expect YYYY-MM-DD from the date input.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Invalid date." };
  }
  const iso = new Date(`${date}T12:00:00.000Z`);
  if (Number.isNaN(iso.getTime())) {
    return { ok: false, error: "Invalid date." };
  }

  const { error } = await blogSupabase
    .from("blog_articles")
    .update({ published_at: iso.toISOString() })
    .eq("slug", slug);

  if (error) {
    console.error("Admin update published_at error:", error);
    return { ok: false, error: "Couldn't save — try again." };
  }

  // Refresh anywhere the date is shown.
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");

  return { ok: true };
}
