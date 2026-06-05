import type { MagicBrand } from "@/lib/magic/types";

export function BrandDna({ brand }: { brand: MagicBrand }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-zinc-100">{brand.name}</h3>
      {brand.tagline && <p className="mt-1 text-sm text-zinc-400">{brand.tagline}</p>}

      <div className="mt-5">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Tone of voice</p>
        <div className="flex flex-wrap gap-1.5">
          {brand.tone.map((t) => (
            <span key={t} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300">{t}</span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Palette</p>
        <div className="flex gap-1.5">
          {brand.palette.map((c) => (
            <span key={c} className="h-7 w-7 rounded-md border border-white/10" style={{ background: c }} />
          ))}
        </div>
      </div>

      {brand.positioning && (
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">{brand.positioning}</p>
      )}
    </div>
  );
}
