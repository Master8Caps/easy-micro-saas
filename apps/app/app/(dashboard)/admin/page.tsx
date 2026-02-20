"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import { loadAdminUsers, activateUser } from "@/server/actions/admin";

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  name: string | null;
  source: string | null;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { role } = useUser();
  const [waitlisted, setWaitlisted] = useState<UserRow[]>([]);
  const [active, setActive] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingIds, setActivatingIds] = useState<Set<string>>(new Set());

  // Redirect non-admins
  useEffect(() => {
    if (role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  // Load users
  useEffect(() => {
    if (role !== "admin") return;

    async function load() {
      const result = await loadAdminUsers();
      if (result.waitlisted) setWaitlisted(result.waitlisted);
      if (result.active) setActive(result.active);
      setLoading(false);
    }
    load();
  }, [role]);

  async function handleActivate(user: UserRow) {
    setActivatingIds((prev) => new Set(prev).add(user.id));

    const result = await activateUser(user.id);

    if (result.success) {
      // Move user from waitlisted to active
      setWaitlisted((prev) => prev.filter((u) => u.id !== user.id));
      setActive((prev) => [{ ...user, status: "active" }, ...prev]);
    }

    setActivatingIds((prev) => {
      const next = new Set(prev);
      next.delete(user.id);
      return next;
    });
  }

  if (role !== "admin") return null;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const roleBadge = (r: string) => {
    const styles: Record<string, string> = {
      admin: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
      paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      free: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    };
    return (
      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[r] ?? styles.free}`}>
        {r}
      </span>
    );
  };

  return (
    <div className="py-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage waitlisted and active users
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
          </div>
        ) : (
          <>
            {/* Waitlist Queue */}
            <section className="mt-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Waitlist</h2>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                  {waitlisted.length}
                </span>
              </div>

              {waitlisted.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
                  <p className="text-sm text-zinc-500">No users on the waitlist</p>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Signed up</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlisted.map((user) => (
                        <tr key={user.id} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-4 py-3 text-sm text-zinc-200">{user.email}</td>
                          <td className="px-4 py-3 text-sm text-zinc-400">{user.name || "—"}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{user.source || "—"}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{formatDate(user.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleActivate(user)}
                              disabled={activatingIds.has(user.id)}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                            >
                              {activatingIds.has(user.id) ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="h-3 w-3 animate-spin rounded-full border border-indigo-300/30 border-t-indigo-300" />
                                  Activating...
                                </span>
                              ) : (
                                "Activate"
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Active Users */}
            <section className="mt-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Active Users</h2>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  {active.length}
                </span>
              </div>

              {active.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
                  <p className="text-sm text-zinc-500">No active users</p>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.map((user) => (
                        <tr key={user.id} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-4 py-3 text-sm text-zinc-200">{user.email}</td>
                          <td className="px-4 py-3">{roleBadge(user.role)}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{formatDate(user.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
