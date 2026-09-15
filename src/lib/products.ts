export type Category = "abayas" | "hijabs";
export type CollectionSlug = "new-in" | "everyday-wear" | "everyday-essentials" | "hijab-accessories" | "modest-co-ord";

export type Product = {
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  colour: string;
  category: Category;
  collections: CollectionSlug[];
  isNew?: boolean;
  isSale?: boolean;
  rating: number;
  reviewCount: number;
  summary: string;
  design: string[];
  images: { src: string; alt: string; width: number; height: number }[];
  /** Shopify numeric product ID (e.g. "9647614918915") — used for Judge.me mapping */
  shopifyId?: string;
  /** Shopify variant ID — set when product comes from Shopify */
  shopifyVariantId?: string;
  /** All Shopify variants for this product */
  shopifyVariants?: { id: string; title: string; availableForSale: boolean; selectedOptions: { name: string; value: string }[] }[];
};

// ── Shopify product cache + reactivity ─────────────────────────

export type CollectionSummary = {
  slug: string;
  title: string;
  description: string;
  heroImage: string;
};

let shopifyProducts: Product[] | null = null;
let shopifyCollections: CollectionSummary[] | null = null;
let shopifyLoaded = false;
let shopifyLoading = false;
type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  for (const fn of listeners) fn();
}

export function onShopifyDataReady(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function isShopifyLoading(): boolean {
  return shopifyLoading;
}

/**
 * Initialise product data from Shopify.
 * Safe to call multiple times — only fetches once.
 * On failure, products remain empty — no silent local fallback.
 */
export async function initShopifyProducts(): Promise<void> {
  if (shopifyLoaded) {
    notifyListeners();
    return;
  }
  if (shopifyLoading) return;
  shopifyLoading = true;

  try {
    const { fetchAllProducts, fetchCollections, fetchCollectionByHandle } = await import("@/lib/shopify/products");

    const products = await fetchAllProducts();

    const collections = await fetchCollections();
    const displayOrder = ["everyday-wear", "new-in", "everyday-essentials", "modest-co-ord", "hijab-accessories"];
    collections.sort((a, b) => displayOrder.indexOf(a.slug) - displayOrder.indexOf(b.slug));
    shopifyCollections = collections;

    const productCollectionMap = new Map<string, CollectionSlug[]>();
    await Promise.all(
      collections.map(async (col) => {
        try {
          const colProducts = await fetchCollectionByHandle(col.slug);
          for (const cp of colProducts) {
            const existing = productCollectionMap.get(cp.slug) || [];
            existing.push(col.slug as CollectionSlug);
            productCollectionMap.set(cp.slug, existing);
          }
        } catch {
          // skip failed collection
        }
      })
    );

    for (const product of products) {
      product.collections = productCollectionMap.get(product.slug) || [];
    }

    shopifyProducts = products;
    shopifyLoaded = true;
  } catch (err) {
    console.error("[LAAF] Shopify products fetch failed:", err);
    shopifyProducts = [];
    shopifyLoaded = true;
  }

  shopifyLoading = false;
  notifyListeners();
}

/**
 * Returns the active product list from Shopify.
 * Returns empty array if Shopify data hasn't loaded yet or failed.
 */
export function getActiveProducts(): Product[] {
  return shopifyProducts ?? [];
}

/**
 * Returns the active collection list from Shopify.
 * Returns empty array if Shopify data hasn't loaded yet or failed.
 */
export function getActiveCollections() {
  return shopifyCollections ?? [];
}

// ── Public API (backward-compatible) ────────────────────────────

export const categoryGroups: { id: Category; label: string }[] = [
  { id: "abayas", label: "Abayas" },
  { id: "hijabs", label: "Hijabs" },
];

export type LocalImage = { src: string; alt: string; width: number; height: number };

export const getProduct = (slug: string) =>
  getActiveProducts().find((p) => p.slug === slug);

export const formatPrice = (p: Product) =>
  `PKR ${p.price.toLocaleString()}`;

export const formatCompareAt = (p: Product) =>
  p.compareAtPrice ? `PKR ${p.compareAtPrice.toLocaleString()}` : undefined;

/* ── Search ─────────────────────────────────────────────────────── */

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/);

  const scored = getActiveProducts().map((p) => {
    const name = p.name.toLowerCase();
    const summary = p.summary.toLowerCase();
    const colour = p.colour.toLowerCase();
    const category = p.category.toLowerCase();
    const collections = p.collections.map((c) => c.replace(/-/g, " ").toLowerCase());
    const design = p.design.map((d) => d.toLowerCase());
    const slug = p.slug.toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (name.includes(term)) score += 10;
      if (name === term) score += 20;
      if (name.startsWith(term)) score += 5;
      if (colour.includes(term)) score += 4;
      if (category.includes(term)) score += 3;
      if (collections.some((c) => c.includes(term))) score += 3;
      if (design.some((d) => d.includes(term))) score += 2;
      if (summary.includes(term)) score += 1;
      if (slug.includes(term)) score += 1;
    }

    return { product: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product);
}
