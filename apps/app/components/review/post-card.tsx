import type { ReviewCard } from "@/server/actions/review";
import { ChannelPill, TypePill } from "@/components/pills";

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
      {/* Header: product (left) · platform (right) */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-content-primary">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
          <span className="truncate">{card.productName}</span>
        </span>
        {card.channel && <ChannelPill channel={card.channel} />}
      </div>

      {/* Image / gradient */}
      <div
        className="h-40 overflow-hidden rounded-xl"
        style={{ background: gradientFor(card.id) }}
      >
        {card.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />
        )}
      </div>

      {/* Meta: type (left) · target avatar (right) */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <TypePill type={card.type} />
        {card.avatarName && (
          <span className="truncate text-[11px] text-content-muted">For · {card.avatarName}</span>
        )}
      </div>

      {/* Title + body */}
      {card.title && <p className="mt-3 text-sm font-semibold text-content-primary">{card.title}</p>}
      <p className="mt-1 line-clamp-4 text-sm text-content-secondary">{card.body}</p>
    </div>
  );
}
