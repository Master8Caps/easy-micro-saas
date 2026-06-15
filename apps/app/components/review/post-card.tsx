import type { ReviewCard } from "@/server/actions/review";

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#a855f7)",
  "linear-gradient(135deg,#0ea5e9,#6366f1)",
  "linear-gradient(135deg,#a855f7,#ec4899)",
];

function gradientFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h + ch.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[h];
}

export function PostCard({ card }: { card: ReviewCard }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-card p-4 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full border border-indigo-500/35 bg-indigo-500/15 px-2.5 py-1 text-[10px] text-indigo-200">
          {card.type}
        </span>
        <span className="text-[10px] text-content-muted">
          Draft{card.avatarName ? ` · ${card.avatarName}` : ""}
        </span>
      </div>
      <div
        className="h-40 overflow-hidden rounded-xl"
        style={{ background: gradientFor(card.id) }}
      >
        {card.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />
        )}
      </div>
      {card.title && <p className="mt-3 text-sm font-semibold text-content-primary">{card.title}</p>}
      <p className="mt-1 line-clamp-4 text-sm text-content-secondary">{card.body}</p>
      <p className="mt-2 text-[10px] text-content-muted">{card.productName}</p>
    </div>
  );
}
