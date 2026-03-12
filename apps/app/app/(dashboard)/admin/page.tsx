export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getUserWithRole, requireAuth } from "@/server/auth";
import { loadSystemStats } from "@/server/actions/admin";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-content-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireAuth();
  const { role } = await getUserWithRole();

  if (role !== "admin") {
    redirect("/");
  }

  const stats = await loadSystemStats();

  if ("error" in stats) {
    redirect("/");
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      waitlist: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    };
    return (
      <span
        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[s] ?? styles.waitlist}`}
      >
        {s}
      </span>
    );
  };

  return (
    <div className="py-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          System Overview
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Platform-wide stats and recent activity
        </p>

        {/* Summary cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Active Users" value={stats.activeUsers} />
          <StatCard label="Waitlisted" value={stats.waitlistedUsers} />
          <StatCard label="Total Products" value={stats.totalProducts} />
          <StatCard label="Generations" value={stats.totalGenerations} />
          <StatCard label="Content Pieces" value={stats.totalContentPieces} />
          <StatCard label="Total Clicks" value={stats.totalClicks} />
          <StatCard
            label="Generations (7d)"
            value={stats.generationsThisWeek}
          />
        </div>

        {/* Recent signups */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Recent Signups</h2>

          {stats.recentSignups.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line p-8 text-center">
              <p className="text-sm text-content-muted">No signups yet</p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-line">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line bg-surface-card">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-muted">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-muted">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-muted">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-muted">
                      Signed up
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSignups.map((user) => (
                    <tr
                      key={user.email}
                      className="border-b border-line-subtle last:border-0"
                    >
                      <td className="px-4 py-3 text-sm text-content-primary">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(user.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-muted">
                        {user.source || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-content-muted">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
