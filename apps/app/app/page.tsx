import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/", active: true },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Content", href: "/content" },
  { label: "Analytics", href: "/analytics" },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-6">
        <div className="font-heading text-lg font-bold">App</div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-zinc-400">
            Welcome back. Here&apos;s your overview.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm text-zinc-500">Active Campaigns</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm text-zinc-500">Total Clicks</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm text-zinc-500">Content Published</p>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-dashed border-zinc-700 p-12 text-center">
          <h2 className="text-lg font-semibold">No campaigns yet</h2>
          <p className="mt-2 text-zinc-400">
            Create your first campaign to get started with targeted content and
            tracking.
          </p>
          <button className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200">
            Create Campaign
          </button>
        </div>
      </main>
    </div>
  );
}
