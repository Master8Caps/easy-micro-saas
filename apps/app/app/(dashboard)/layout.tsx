import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserWithRole, requireAuth } from "@/server/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserProvider } from "@/components/user-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const { role, status } = await getUserWithRole();

  if (status === "waitlist") {
    redirect("/waitlist");
  }

  return (
    <UserProvider email={user.email ?? ""} role={role}>
      <div className="flex min-h-screen">
        <aside className="flex w-60 flex-col border-r border-white/[0.06] px-4 py-5">
          <Link href="/" className="flex items-center gap-2.5 px-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" className="shrink-0">
              <defs>
                <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8"/>
                  <stop offset="100%" stopColor="#a78bfa"/>
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#logo-g)"/>
              <path d="M10 10h12M10 16h9M10 22h12M10 10v12" stroke="#18181b" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span className="font-heading text-sm font-semibold tracking-tight">Easy Micro SaaS</span>
          </Link>
          <SidebarNav />
          <div className="mt-auto border-t border-white/[0.06] px-3 pt-4">
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
            <SignOutButton />
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </UserProvider>
  );
}
