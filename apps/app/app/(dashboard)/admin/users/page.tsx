"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-context";
import {
  loadAdminUsers,
  activateUser,
  inviteUser,
} from "@/server/actions/admin";

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  name: string | null;
  source: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { role } = useUser();
  const [waitlisted, setWaitlisted] = useState<UserRow[]>([]);
  const [invited, setInvited] = useState<UserRow[]>([]);
  const [active, setActive] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingIds, setActivatingIds] = useState<Set<string>>(new Set());

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

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
      if (result.invited) setInvited(result.invited);
      if (result.active) setActive(result.active);
      setLoading(false);
    }
    load();
  }, [role]);

  // Auto-dismiss invite success
  useEffect(() => {
    if (inviteSuccess) {
      const t = setTimeout(() => setInviteSuccess(""), 4000);
      return () => clearTimeout(t);
    }
  }, [inviteSuccess]);

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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");

    if (!inviteEmail.trim()) return;

    setInviting(true);
    const result = await inviteUser(inviteEmail.trim());

    if (result.error) {
      setInviteError(result.error);
    } else {
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      // Reload users to show the new invited user
      const refreshed = await loadAdminUsers();
      if (refreshed.waitlisted) setWaitlisted(refreshed.waitlisted);
      if (refreshed.invited) setInvited(refreshed.invited);
      if (refreshed.active) setActive(refreshed.active);
    }
    setInviting(false);
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
      free: "border-zinc-500/30 bg-zinc-500/10 text-content-secondary",
    };
    return (
      <span
        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[r] ?? styles.free}`}
      >
        {r}
      </span>
    );
  };

  return (
    <div className="py-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Users
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Manage waitlisted and active users
        </p>

        {/* Invite User */}
        <form
          onSubmit={handleInvite}
          className="mt-8 rounded-xl border border-line bg-surface-card p-4"
        >
          <div className="flex items-center gap-3">
            <label
              htmlFor="inviteEmail"
              className="text-sm font-medium text-content-secondary"
            >
              Invite user
            </label>
            <input
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {inviting ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border border-indigo-300/30 border-t-indigo-300" />
                  Sending...
                </span>
              ) : (
                "Invite"
              )}
            </button>
          </div>
          {inviteError && (
            <p className="mt-2 text-sm text-red-400">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="mt-2 text-sm text-emerald-400">{inviteSuccess}</p>
          )}
        </form>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
          </div>
        ) : (
          <>
            {/* Pending Invites */}
            <section className="mt-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Pending Invites</h2>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-400">
                  {invited.length}
                </span>
              </div>

              {invited.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-line p-8 text-center">
                  <p className="text-sm text-content-muted">
                    No pending invitations
                  </p>
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
                          Invited
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invited.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-line-subtle last:border-0"
                        >
                          <td className="px-4 py-3 text-sm text-content-primary">
                            {user.email}
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

            {/* Waitlist Queue */}
            <section className="mt-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Waitlist</h2>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                  {waitlisted.length}
                </span>
              </div>

              {waitlisted.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-line p-8 text-center">
                  <p className="text-sm text-content-muted">
                    No users on the waitlist
                  </p>
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
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-muted">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-muted">
                          Signed up
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-content-muted">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlisted.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-line-subtle last:border-0"
                        >
                          <td className="px-4 py-3 text-sm text-content-primary">
                            {user.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-content-secondary">
                            {user.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-content-muted">
                            {user.source || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-content-muted">
                            {formatDate(user.created_at)}
                          </td>
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
                <div className="mt-4 rounded-xl border border-dashed border-line p-8 text-center">
                  <p className="text-sm text-content-muted">No active users</p>
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
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-muted">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-line-subtle last:border-0"
                        >
                          <td className="px-4 py-3 text-sm text-content-primary">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">{roleBadge(user.role)}</td>
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
          </>
        )}
      </div>
    </div>
  );
}
