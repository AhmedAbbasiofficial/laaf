/**
 * Judge.me integration — proxied through server API routes.
 *
 * All Judge.me API calls go through /api/judgeme/reviews to keep the
 * private token server-side only.
 */

// ── Config ───────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────

export type JudgeMeReview = {
  id: number;
  title: string;
  body: string;
  rating: number;
  product_external_id: number;
  reviewer: {
    id: number;
    name: string;
    email: string;
  };
  source: string;
  curated: string;
  published: boolean;
  hidden: boolean;
  verified: string;
  created_at: string;
  updated_at: string;
  has_published_pictures: boolean;
  pictures: { id: number; url: string; thumb_url: string }[];
  product_title: string;
  product_handle: string;
};

export type JudgeMeReviewsResponse = {
  current_page: number;
  per_page: number;
  reviews: JudgeMeReview[];
};

export type JudgeMeCountResponse = {
  count: number;
};

// ── Fetch reviews for a product ──────────────────────────────────

export async function fetchJudgeMeReviews(
  args: { data: string },
): Promise<{ reviews: JudgeMeReview[]; error: string | null }> {
  const handle = args.data;

  try {
    const res = await fetch(`/api/judgeme/reviews?action=reviews&handle=${encodeURIComponent(handle)}&per_page=50&page=1`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`[Judge.me] Reviews fetch failed: ${res.status}`);
      return { reviews: [] as JudgeMeReview[], error: `HTTP ${res.status}` };
    }

    const data: JudgeMeReviewsResponse = await res.json();
    return { reviews: data.reviews, error: null };
  } catch (err) {
    console.error("[Judge.me] Reviews fetch error:", err);
    return { reviews: [] as JudgeMeReview[], error: String(err) };
  }
}

// ── Fetch review count for a product ─────────────────────────────

export async function fetchJudgeMeReviewCount(
  args: { data: string },
): Promise<{ count: number }> {
  const handle = args.data;

  try {
    const res = await fetch(`/api/judgeme/reviews?action=count&handle=${encodeURIComponent(handle)}`);
    if (!res.ok) return { count: 0 };

    const data: JudgeMeCountResponse = await res.json();
    return { count: data.count };
  } catch {
    return { count: 0 };
  }
}

// ── Fetch all reviews (batch — for product card ratings) ─────────

export async function fetchAllJudgeMeReviews(): Promise<{ reviews: JudgeMeReview[] }> {
  try {
    const allReviews: JudgeMeReview[] = [];
    let page = 1;
    const perPage = 100;

    for (let i = 0; i < 5; i++) {
      const res = await fetch(`/api/judgeme/reviews?action=reviews&per_page=${perPage}&page=${page}`);
      if (!res.ok) break;

      const data: JudgeMeReviewsResponse = await res.json();
      allReviews.push(...data.reviews);

      if (data.reviews.length < perPage) break;
      page++;
    }

    return { reviews: allReviews };
  } catch {
    return { reviews: [] as JudgeMeReview[] };
  }
}

// ── Submit a review to Judge.me ──────────────────────────────────

export type ReviewSubmission = {
  shopDomain: string;
  platform: string;
  name: string;
  email: string;
  rating: number;
  title?: string;
  body: string;
  id?: string;
  picture_urls?: string[];
};

export async function submitJudgeMeReview(
  args: { data: ReviewSubmission },
): Promise<{ success: boolean; error?: string; message?: string }> {
  const data = args.data;

  try {
    const res = await fetch("/api/judgeme/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    try { json = JSON.parse(text); } catch { /* not JSON */ }

    if (!res.ok) {
      return { success: false, error: (json["error"] as string) || `HTTP ${res.status}` };
    }

    return { success: true, message: (json["message"] as string) || "Review submitted" };
  } catch (err) {
    console.error("[Judge.me] Review submission error:", err);
    return { success: false, error: String(err) };
  }
}
