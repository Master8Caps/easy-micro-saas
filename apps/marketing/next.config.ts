import type { NextConfig } from "next";

function supabaseStorageBase(): string | null {
  const url = process.env.SUPABASE_URL;
  if (!url) return null;
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/blog-media`;
}

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  async rewrites() {
    const base = supabaseStorageBase();
    if (!base) return [];
    return [
      {
        source: "/uploads/:filename*",
        destination: `${base}/:filename*`,
      },
    ];
  },
};

export default nextConfig;
