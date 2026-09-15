/**
 * Review data layer — powered by Judge.me.
 *
 * All functions are async and fetch real review data from Judge.me
 * via direct browser-safe fetch calls in judgeme.ts.
 *
 * The ProductReview type is preserved so the existing LAAF review UI
 * components (ReviewSection, WriteReviewModal, ProductCard) work
 * without visual changes.
 */
import {
  fetchJudgeMeReviews,
  fetchAllJudgeMeReviews,
  submitJudgeMeReview,
  type JudgeMeReview,
  type ReviewSubmission,
} from "./judgeme";

// ── Types (unchanged — keeps existing UI components working) ────

export type ProductReview = {
  id: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  customerName: string;
  customerEmail: string;
  verifiedBuyer: boolean;
  imageUrl?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
};

export type ReviewStats = {
  average: number;
  count: number;
  breakdown: number[];
};

// ── Mapping: Judge.me → LAAF ProductReview ──────────────────────

function mapJudgeMeToProductReview(jm: JudgeMeReview): ProductReview {
  const reviewImage = jm.pictures?.[0]?.url;
  return {
    id: String(jm.id),
    productId: jm.product_handle,
    rating: jm.rating,
    title: jm.title || "",
    body: jm.body || "",
    customerName: jm.reviewer?.name || "Anonymous",
    customerEmail: jm.reviewer?.email || "",
    verifiedBuyer: jm.verified === "ok",
    ...(reviewImage ? { imageUrl: reviewImage } : {}),
    createdAt: jm.created_at,
    status: jm.published ? "approved" : "pending",
  };
}

// ── Stats computation ───────────────────────────────────────────

export function computeReviewStats(reviews: ProductReview[]): ReviewStats {
  if (reviews.length === 0) {
    return { average: 0, count: 0, breakdown: [0, 0, 0, 0, 0] };
  }
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const average = Math.round((total / reviews.length) * 10) / 10;
  const breakdown = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const idx = r.rating - 1;
    if (idx >= 0 && idx < 5) {
      breakdown[idx] = (breakdown[idx] ?? 0) + 1;
    }
  });
  return { average, count: reviews.length, breakdown };
}

// ── Async data fetching (replaces localStorage) ─────────────────

/**
 * Fetch published reviews for a product from Judge.me.
 * Returns reviews mapped to the existing ProductReview type.
 */
export async function getReviewsForProduct(
  handle: string,
): Promise<ProductReview[]> {
  try {
    const result = await fetchJudgeMeReviews({ data: handle });
    const reviews = result?.reviews ?? [];
    return reviews
      .filter((r: JudgeMeReview) => r.published && !r.hidden)
      .map(mapJudgeMeToProductReview);
  } catch (err) {
    console.error("[reviews] Failed to fetch reviews for", handle, err);
    return [];
  }
}

/**
 * Fetch review stats (average, count, breakdown) for a product.
 */
export async function getReviewStats(handle: string): Promise<ReviewStats> {
  try {
    const reviews = await getReviewsForProduct(handle);
    return computeReviewStats(reviews);
  } catch (err) {
    console.error("[reviews] Failed to fetch stats for", handle, err);
    return { average: 0, count: 0, breakdown: [0, 0, 0, 0, 0] };
  }
}

/**
 * Batch-fetch ratings for all products (for product card display).
 * Returns a map of handle → { average, count }.
 */
export async function getAllProductRatings(): Promise<
  Record<string, { average: number; count: number }>
> {
  try {
    const result = await fetchAllJudgeMeReviews();
    const reviews = (result?.reviews ?? []).filter(
      (r: JudgeMeReview) => r.published && !r.hidden,
    );

    const map: Record<string, { total: number; count: number }> = {};
    for (const r of reviews) {
      const handle = r.product_handle;
      if (!map[handle]) map[handle] = { total: 0, count: 0 };
      map[handle].total += r.rating;
      map[handle].count++;
    }

    const ratings: Record<string, { average: number; count: number }> = {};
    for (const [handle, { total, count }] of Object.entries(map)) {
      ratings[handle] = {
        average: Math.round((total / count) * 10) / 10,
        count,
      };
    }
    return ratings;
  } catch {
    return {};
  }
}

/**
 * Submit a review to Judge.me.
 * The review goes through Judge.me's moderation/publication pipeline.
 */
export async function addReview(data: {
  productId: string;
  shopifyId?: string;
  rating: number;
  title: string;
  body: string;
  customerName: string;
  customerEmail: string;
  imageUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const submission: ReviewSubmission = {
      shopDomain: "6c1sjh-w1.myshopify.com",
      platform: "shopify",
      name: data.customerName,
      email: data.customerEmail,
      rating: data.rating,
      title: data.title,
      body: data.body,
      ...(data.shopifyId ? { id: data.shopifyId } : {}),
      ...(data.imageUrl ? { picture_urls: [data.imageUrl] } : {}),
    };

    const result = await submitJudgeMeReview({ data: submission });
    if (result?.success) {
      return { success: true };
    }
    return { success: false, error: (result?.error as string) || "Submission failed" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
