import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getReviewsForProduct, getReviewStats, type ProductReview, type ReviewStats } from "@/lib/reviews";
import { WriteReviewModal } from "./WriteReviewModal";

function ReviewerInitial({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-muted text-[0.7rem] font-semibold text-foreground">
      {initial}
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  const date = new Date(review.createdAt);
  const formatted = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const displayName = review.customerName;

  return (
    <div className="border-t border-border py-5">
      <div className="flex items-start gap-3">
        <ReviewerInitial name={displayName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.78rem] font-medium text-foreground">
              {displayName}
            </span>
            {review.verifiedBuyer && (
              <span className="text-[0.6rem] uppercase tracking-wide text-accent font-semibold">
                Verified Buyer
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < review.rating
                      ? "fill-[#f5a623] text-[#f5a623]"
                      : "fill-none text-muted-foreground/30",
                  )}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="text-[0.65rem] text-muted-foreground">{formatted}</span>
          </div>
          {review.title && (
            <p className="mt-2 text-[0.8rem] font-medium text-foreground">
              {review.title}
            </p>
          )}
          <p className="mt-1 text-[0.8rem] text-muted-foreground leading-relaxed">
            {review.body}
          </p>
          {review.imageUrl && (
            <div className="mt-3">
              <img
                src={review.imageUrl}
                alt="Customer review photo"
                className="h-24 w-24 object-cover border border-border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingBreakdown({
  breakdown,
  total,
}: {
  breakdown: number[];
  total: number;
}) {
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = breakdown[star - 1] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="text-[0.65rem] text-muted-foreground w-3 text-right">
              {star}
            </span>
            <Star className="h-3 w-3 fill-[#f5a623] text-[#f5a623]" strokeWidth={1} />
            <div className="flex-1 h-1.5 bg-muted overflow-hidden">
              <div
                className="h-full bg-[#f5a623] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[0.65rem] text-muted-foreground w-8 text-right">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

const EMPTY_STATS: ReviewStats = { average: 0, count: 0, breakdown: [0, 0, 0, 0, 0] };

export function ReviewSection({
  productId,
  shopifyId,
}: {
  productId: string;
  shopifyId?: string;
}) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedReviews, fetchedStats] = await Promise.all([
        getReviewsForProduct(productId),
        getReviewStats(productId),
      ]);
      setReviews(fetchedReviews);
      setStats(fetchedStats);
    } catch {
      setReviews([]);
      setStats(EMPTY_STATS);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = useCallback(() => {
    setModalOpen(false);
    // Re-fetch reviews after submission
    loadData();
  }, [loadData]);

  return (
    <div>
      {/* Section heading */}
      <div className="border-t border-border pt-8">
        <h2 className="font-serif text-[1.3rem] md:text-[1.6rem] font-normal text-foreground mb-6">
          Customer Reviews
        </h2>

        {loading ? (
          /* Loading state — matches existing visual style */
          <div className="text-center py-8">
            <p className="text-[0.65rem] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-2">
              Loading Reviews…
            </p>
          </div>
        ) : stats.count === 0 ? (
          /* Empty state */
          <div className="text-center py-8">
            <p className="text-[0.65rem] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-2">
              No Customer Reviews Yet
            </p>
            <p className="text-[0.8rem] text-muted-foreground mb-5">
              Be the first to review this product.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 border border-foreground px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-wide text-foreground hover:bg-foreground hover:text-white transition-colors"
            >
              Write a Customer Review
            </button>
          </div>
        ) : (
          /* Reviews exist */
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: summary */}
            <div className="md:w-56 shrink-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[1.8rem] font-semibold text-foreground leading-none">
                  {stats.average}
                </span>
                <span className="text-[0.75rem] text-muted-foreground">/ 5</span>
              </div>
              <div className="flex gap-0.5 mb-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.round(stats.average)
                        ? "fill-[#f5a623] text-[#f5a623]"
                        : "fill-none text-muted-foreground/30",
                    )}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <p className="text-[0.72rem] text-muted-foreground mb-4">
                Based on {stats.count} review{stats.count !== 1 ? "s" : ""}
              </p>

              <RatingBreakdown breakdown={stats.breakdown} total={stats.count} />

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-5 w-full border border-foreground py-3 text-[0.7rem] font-semibold uppercase tracking-wide text-foreground hover:bg-foreground hover:text-white transition-colors"
              >
                Write a Customer Review
              </button>
            </div>

            {/* Right: review list */}
            <div className="flex-1">
              {reviews
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
            </div>
          </div>
        )}
      </div>

      <WriteReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={productId}
        {...(shopifyId ? { shopifyId } : {})}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
