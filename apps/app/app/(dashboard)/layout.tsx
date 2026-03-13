import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserWithRole, requireAuth } from "@/server/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserProvider } from "@/components/user-context";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const { role, status } = await getUserWithRole();

  if (status === "waitlist") redirect("/waitlist");

  return (
    <UserProvider email={user.email ?? ""} role={role}>
      <DashboardShell email={user.email ?? ""}>
        {children}
      </DashboardShell>
    </UserProvider>
  );
}
