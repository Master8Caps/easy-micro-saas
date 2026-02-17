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
              <path d="M3,8 H9 M3,8 V24 M3,16 H8 M3,24 H9" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M12,24 V8 L16,14 L20,8 V24" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M27,9 C23,9 23,16 25,16 C27,16 27,23 23,23" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
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
