export function TagChip({ slug }: { slug: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-zinc-400">
      #{slug}
    </span>
  );
}
