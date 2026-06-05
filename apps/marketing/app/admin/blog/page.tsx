import type { Metadata } from "next";
import { blogSupabase } from "@/lib/blog/supabase";
import { BlogDateEditor, type AdminPost } from "@/components/admin/blog-date-editor";

export const metadata: Metadata = {
  title: "Blog admin — published dates",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function fetchAllPosts(): Promise<AdminPost[]> {
  const { data, error } = await blogSupabase
    .from("blog_articles")
    .select("slug, title, published, published_at")
    .order("published_at", { ascending: false });

  if (error || !data) {
    console.error("Admin posts fetch error:", error);
    return [];
  }

  return data.map((a) => ({
    slug: a.slug,
    title: a.title,
    published: a.published,
    published_at: a.published_at,
  }));
}

export default async function BlogAdminPage() {
  const posts = await fetchAllPosts();

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight">Blog — published dates</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Change the published date of any post. Enter your publish key once,
          then save each row.
        </p>

        <BlogDateEditor posts={posts} />
      </div>
    </main>
  );
}
