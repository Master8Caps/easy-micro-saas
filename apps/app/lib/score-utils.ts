export function getScoreTier(score: number): { label: string; color: string } {
  if (score === 0) return { label: "No data", color: "zinc" };
  if (score >= 80) return { label: "Top performer", color: "emerald" };
  if (score >= 50) return { label: "Moderate", color: "amber" };
  if (score >= 20) return { label: "Low", color: "orange" };
  return { label: "Underperforming", color: "red" };
}

export function scoreBarColor(color: string): string {
  const map: Record<string, string> = {
    emerald: "bg-emerald-500/60",
    amber: "bg-amber-500/60",
    orange: "bg-orange-500/60",
    red: "bg-red-500/60",
    zinc: "bg-zinc-600/40",
  };
  return map[color] ?? "bg-zinc-600/40";
}

export function scoreTextColor(color: string): string {
  const map: Record<string, string> = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    orange: "text-orange-400",
    red: "text-red-400",
    zinc: "text-zinc-500",
  };
  return map[color] ?? "text-zinc-500";
}

export interface CompositeInput {
  clicks: number;
  maxClicks: number;
  engagementRaw: number;
  maxEngagementRaw: number;
  rating: number | null; // -1, 0, or 1
}

export function computeEngagementRaw(
  views: number | null,
  likes: number | null,
  comments: number | null,
  shares: number | null,
): number {
  return (
    (views ?? 0) * 1 +
    (likes ?? 0) * 3 +
    (comments ?? 0) * 5 +
    (shares ?? 0) * 4
  );
}

export function computeCompositeScore(input: CompositeInput): number {
  // Click signal (40%) — normalized 0-100
  const clickSignal =
    input.maxClicks > 0 ? (input.clicks / input.maxClicks) * 100 : 0;

  // Engagement signal (40%) — normalized 0-100
  const engagementSignal =
    input.maxEngagementRaw > 0
      ? (input.engagementRaw / input.maxEngagementRaw) * 100
      : 0;

  // Rating signal (20%) — thumbs up=100, neutral=50, thumbs down=0
  const ratingSignal =
    input.rating === 1 ? 100 : input.rating === -1 ? 0 : 50;

  return Math.round(
    clickSignal * 0.4 + engagementSignal * 0.4 + ratingSignal * 0.2,
  );
}
