/**
 * Judge.me server-side integration.
 *
 * ALL functions in this file run on the server via createServerFn.
 * The JUDGEME_PRIVATE_API_TOKEN is never exposed to the browser.
 */
import { createServerFn } from "@tanstack/react-start";

const JUDGEME_API = "https://judge.me/api/v1";

function getEnv() {
  return {
    shopDomain: process.env["JUDGEME_SHOP_DOMAIN"] ?? "6c1sjh-w1.myshopify.com",
    privateToken: process.env["JUDGEME_PRIVATE_API_TOKEN"] ?? "",
  };
}

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

export const fetchJudgeMeReviews = createServerFn({ method: "GET" })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { shopDomain, privateToken } = getEnv();
    if (!privateToken) {
      return { reviews: [] as JudgeMeReview[], error: "Missing Judge.me private token" };
    }

    try {
      const url = new URL(`${JUDGEME_API}/reviews`);
      url.searchParams.set("shop_domain", shopDomain);
      url.searchParams.set("api_token", privateToken);
      url.searchParams.set("handle", handle);
      url.searchParams.set("per_page", "50");
      url.searchParams.set("page", "1");

      const res = await fetch(url.toString(), {
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
  });

// ── Fetch review count for a product ─────────────────────────────

export const fetchJudgeMeReviewCount = createServerFn({ method: "GET" })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { shopDomain, privateToken } = getEnv();
    if (!privateToken) return { count: 0 };

    try {
      const url = new URL(`${JUDGEME_API}/reviews/count`);
      url.searchParams.set("shop_domain", shopDomain);
      url.searchParams.set("api_token", privateToken);
      url.searchParams.set("handle", handle);

      const res = await fetch(url.toString());
      if (!res.ok) return { count: 0 };

      const data: JudgeMeCountResponse = await res.json();
      return { count: data.count };
    } catch {
      return { count: 0 };
    }
  });

// ── Fetch all reviews (batch — for product card ratings) ─────────

export const fetchAllJudgeMeReviews = createServerFn({ method: "GET" })
  .handler(async () => {
    const { shopDomain, privateToken } = getEnv();
    if (!privateToken) return { reviews: [] as JudgeMeReview[] };

    try {
      const allReviews: JudgeMeReview[] = [];
      let page = 1;
      const perPage = 100;

      // Paginate through all reviews (cap at 5 pages = 500 reviews)
      for (let i = 0; i < 5; i++) {
        const url = new URL(`${JUDGEME_API}/reviews`);
        url.searchParams.set("shop_domain", shopDomain);
        url.searchParams.set("api_token", privateToken);
        url.searchParams.set("per_page", String(perPage));
        url.searchParams.set("page", String(page));

        const res = await fetch(url.toString());
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
  });

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

export const submitJudgeMeReview = createServerFn({ method: "GET" })
  .validator((data: ReviewSubmission) => data)
  .handler(async ({ data }) => {
    const { privateToken } = getEnv();
    if (!privateToken) {
      return { success: false, error: "Missing Judge.me private token" };
    }

    try {
      const url = new URL(`${JUDGEME_API}/reviews`);
      url.searchParams.set("shop_domain", data.shopDomain);
      url.searchParams.set("api_token", privateToken);

      const body: Record<string, unknown> = {
        shop_domain: data.shopDomain,
        platform: data.platform,
        name: data.name,
        email: data.email,
        rating: data.rating,
        body: data.body,
      };
      if (data.title) body["title"] = data.title;
      if (data.id) body["id"] = data.id;
      if (data.picture_urls?.length) body["picture_urls"] = data.picture_urls;

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let json: Record<string, unknown> = {};
      try { json = JSON.parse(text); } catch { /* not JSON */ }

      if (!res.ok) {
        return { success: false, error: json["error"] || `HTTP ${res.status}` };
      }

      return { success: true, message: json["message"] || "Review submitted" };
    } catch (err) {
      console.error("[Judge.me] Review submission error:", err);
      return { success: false, error: String(err) };
    }
  });
