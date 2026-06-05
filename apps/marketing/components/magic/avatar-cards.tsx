import type { MagicAvatar } from "@/lib/magic/types";

export function AvatarCards({ avatars }: { avatars: MagicAvatar[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {avatars.map((a) => (
        <div key={a.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white">
              {a.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">{a.name}</p>
              <p className="text-xs text-zinc-500">{a.role}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1">
            {a.painPoints.map((p) => (
              <li key={p} className="text-xs text-zinc-400">• {p}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {a.channels.map((c) => (
              <span key={c} className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">{c}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
