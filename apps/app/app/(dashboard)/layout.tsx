import Link from "next/link";
import { requireAuth } from "@/server/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-zinc-800 p-6">
        <Link href="/" className="font-heading text-lg font-bold">
          Micro Machine
        </Link>
        <SidebarNav />
        <div className="mt-auto border-t border-zinc-800 pt-4">
          <p className="truncate text-sm text-zinc-400">{user.email}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
