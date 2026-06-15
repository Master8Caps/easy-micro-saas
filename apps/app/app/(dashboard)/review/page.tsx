import { getReviewDeck } from "@/server/actions/review";
import { ReviewDeck } from "@/components/review/review-deck";

export default async function ReviewPage() {
  const cards = await getReviewDeck();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-content-primary">Review</h1>
      </div>
      <p className="mb-8 text-sm text-content-muted">
        {cards.length} draft{cards.length === 1 ? "" : "s"} to review · swipe right to approve, left to bin.
      </p>
      <ReviewDeck initialCards={cards} />
    </div>
  );
}
