import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { getActiveProducts, type Product } from "@/lib/products";
import { getAllProductRatings } from "@/lib/reviews";
import { Shell } from "@/components/site/Section";
import { ProductCard } from "@/components/site/ProductCard";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";

export const Route = createFileRoute<'/collection/'>('/collection/')({
  head: () => {
    const title = "Shop All Abayas & Hijabs — LAAF";
    return {
      meta: [
        { title },
        { name: "description", content: "Explore LAAF's complete collection of premium modest fashion. Filter by style and discover elevated abayas and hijabs." },
        { property: "og:title", content: title },
      ],
    };
  },
  component: Collection,
});

function useQuery() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(location.search);
}

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest First" },
];

function sortProducts(list: Product[], sort: string, ratings: Record<string, { average: number; count: number }>): Product[] {
  switch (sort) {
    case "price-asc": return [...list].sort((a, b) => a.price - b.price);
    case "price-desc": return [...list].sort((a, b) => b.price - a.price);
    case "rating": return [...list].sort((a, b) => (ratings[b.slug]?.average ?? 0) - (ratings[a.slug]?.average ?? 0) || (ratings[b.slug]?.count ?? 0) - (ratings[a.slug]?.count ?? 0));
    case "newest": return [...list].filter((p) => p.isNew).concat([...list].filter((p) => !p.isNew));
    default: return list;
  }
}

function Collection() {
  const q = useQuery();
  const [searchTerm, setSearchTerm] = useState(q.get("q") || "");
  const [sort, setSort] = useState("featured");
  const [filterOpen, setFilterOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({});

  // Fetch real review ratings from Judge.me
  useEffect(() => {
    let cancelled = false;
    getAllProductRatings().then((r) => {
      if (!cancelled) setRatings(r);
    });
    return () => { cancelled = true; };
  }, []);

  const category = q.get("category") || undefined;
  const isSale = q.get("sale") === "1";
  const isFresh = q.get("fresh") === "1";

  const filtered = useMemo(() => {
    let list = getActiveProducts().filter((p) => {
      if (category && p.category !== category) return false;
      if (isSale && !p.isSale) return false;
      if (isFresh && !p.isNew) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(s) || p.summary.toLowerCase().includes(s);
      }
      return true;
    });
    return sortProducts(list, sort, ratings);
  }, [category, isSale, isFresh, searchTerm, sort, ratings]);

  const activeLabel = category
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : isSale
        ? "Sale"
        : isFresh
          ? "New Arrivals"
          : "All Products";

  return (
    <>
      {/* Collection header */}
      <div className="border-b border-border bg-white py-8 md:py-10">
        <Shell>
          <div className="text-center">
            <nav className="text-[0.65rem] text-muted-foreground mb-3 uppercase tracking-wider">
              <a href="/" className="hover:text-foreground transition-colors">Home</a>
              <span className="mx-2">/</span>
              <span className="text-foreground">Shop</span>
              {activeLabel !== "All Products" && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-foreground">{activeLabel}</span>
                </>
              )}
            </nav>
            <h1 className="font-serif text-[1.8rem] md:text-[2.5rem] font-normal text-foreground">{activeLabel}</h1>
            <p className="mt-2 text-[0.82rem] text-muted-foreground">{filtered.length} products</p>
          </div>
        </Shell>
      </div>

      <div className="bg-white min-h-screen">
        <Shell className="py-8">
          {/* Filter / Sort bar */}
          <div className="flex items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
            {/* Filters */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              <a
                href="/collection"
                className={`px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-wide border transition-colors ${!category && !isSale && !isFresh ? "border-foreground bg-foreground text-white" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}
              >
                All
              </a>
            </div>

            {/* Mobile filter toggle */}
            <button
              type="button"
              className="flex items-center gap-2 md:hidden text-[0.7rem] font-medium uppercase tracking-wide border border-border px-3 py-1.5 hover:bg-muted transition-colors"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
              Filter
            </button>

            {/* Right: search + sort */}
            <div className="flex items-center gap-3 ml-auto">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="hidden sm:block w-40 border border-border px-3 py-1.5 text-[0.75rem] focus:outline-none focus:border-foreground transition-colors"
              />
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none border border-border pr-8 pl-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-foreground bg-white focus:outline-none focus:border-foreground cursor-pointer transition-colors"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Mobile filter drawer */}
          {filterOpen && (
            <div className="mb-6 p-4 border border-border bg-muted/30 md:hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide">Filter</span>
                <button type="button" onClick={() => setFilterOpen(false)}>
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="mt-3">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full border border-border px-3 py-2 text-[0.75rem] focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
          )}

          {/* Product grid */}
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-2xl font-normal text-foreground">No products found</p>
              <p className="mt-3 text-[0.85rem] text-muted-foreground">Try adjusting your filters or search term.</p>
              <a href="/collection" className="mt-6 inline-flex items-center border border-foreground px-6 py-2.5 text-[0.72rem] font-medium uppercase tracking-wide hover:bg-foreground hover:text-white transition-colors">
                Clear Filters
              </a>
            </div>
          ) : (
            <div className="grid gap-x-4 gap-y-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p, i) => (
                <ProductCard
                  key={p.slug}
                  product={p}
                  priority={i < 4}
                  reviewRating={ratings[p.slug]?.average}
                  reviewCount={ratings[p.slug]?.count}
                />
              ))}
            </div>
          )}
        </Shell>
      </div>
    </>
  );
}

export default Collection;
