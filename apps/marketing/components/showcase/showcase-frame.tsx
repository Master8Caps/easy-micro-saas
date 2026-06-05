import type { ReactNode } from "react";

type ShowcaseFrameProps = {
  /** Small caption pill, e.g. "Tinder for social". */
  label: string;
  /**
   * Optional real image to show instead of the code mockup. Drop a screenshot
   * here later (e.g. "/showcase/swipe.png") and it replaces the mockup with no
   * other changes. See docs/native.md.
   */
  image?: string;
  imageAlt?: string;
  className?: string;
  /** The code-built mockup, shown when no `image` is provided. */
  children: ReactNode;
};

export function ShowcaseFrame({
  label,
  image,
  imageAlt,
  className = "",
  children,
}: ShowcaseFrameProps) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01] transition-colors duration-300 hover:border-indigo-500/25 ${className}`}
    >
      <span className="absolute left-4 top-4 z-10 rounded-full border border-white/[0.08] bg-zinc-950/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-300 backdrop-blur">
        {label}
      </span>

      {image ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={image}
          alt={imageAlt ?? label}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col justify-center p-5 pt-14">
          {children}
        </div>
      )}
    </div>
  );
}
