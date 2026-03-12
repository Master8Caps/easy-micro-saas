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
      <div className="flex h-screen">
        <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-line px-4 py-5">
          <Link href="/" className="flex items-center gap-2.5 px-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" className="shrink-0">
              <path d="M16,3 Q21,10 21,18 Q21,24 16,24 Q11,24 11,18 Q11,10 16,3Z" fill="#6366f1"/>
              <circle cx="16" cy="14" r="2.5" fill="white"/>
              <path d="M11,18 L7,23 L11,22Z" fill="#818cf8"/>
              <path d="M21,18 L25,23 L21,22Z" fill="#818cf8"/>
              <path d="M14,24 L16,28 L18,24Z" fill="#a78bfa"/>
              <path d="M27,4 L28,6.5 L30,7 L28,7.5 L27,10 L26,7.5 L24,7 L26,6.5Z" fill="#a78bfa"/>
              <path d="M4,21 L4.7,22.5 L6,23 L4.7,23.5 L4,25 L3.3,23.5 L2,23 L3.3,22.5Z" fill="#c4b5fd"/>
            </svg>
            <span className="font-heading text-sm font-semibold tracking-tight">Easy Micro SaaS</span>
          </Link>
          <SidebarNav />
          <div className="mt-auto border-t border-line px-3 pt-4">
            <p className="truncate text-xs text-content-muted">{user.email}</p>
            <SignOutButton />
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </UserProvider>
  );
}
