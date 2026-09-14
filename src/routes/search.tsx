import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { searchProducts, formatPrice, onShopifyDataReady, isShopifyLoading } from "@/lib/products";
import { Shell } from "@/components/site/Section";
import { ProductCard } from "@/components/site/ProductCard";
import { Search, X } from "lucide-react";

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
  }),
  head: ({ search }) => {
    const q = search?.q || "";
    return {
      meta: [
        { title: q ? `Search: ${q} — LAAF` : "Search — LAAF" },
        { name: "description", content: "Search LAAF's collection of premium modest fashion." },
      ],
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const [query, setQuery] = useState(initialQ);
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const loading = mounted && isShopifyLoading();

  useEffect(() => {
    setMounted(true);
    return onShopifyDataReady(() => setTick((t) => t + 1));
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchProducts(query);
  }, [query, tick]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = query.trim();
    if (val) {
      navigate({ to: `/search`, search: { q: val } });
    }
  };

  return (
    <>
      {/* Search header */}
      <div className="border-b border-border bg-white py-8 md:py-10">
        <Shell>
          <div className="text-center">
            <nav className="text-[0.65rem] text-muted-foreground mb-3 uppercase tracking-wider">
              <a href="/" className="hover:text-foreground transition-colors">Home</a>
              <span className="mx-2">/</span>
              <span className="text-foreground">Search</span>
            </nav>
            <h1 className="font-serif text-[1.8rem] md:text-[2.5rem] font-normal text-foreground">
              {initialQ ? `Search results for "${initialQ}"` : "Search"}
            </h1>

            {/* Inline search bar */}
            <form onSubmit={handleSubmit} className="mt-5 mx-auto max-w-md flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search LAAF products..."
                  className="w-full border border-border pl-9 pr-8 py-2.5 text-[0.82rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-foreground text-white px-5 py-2.5 text-[0.72rem] font-semibold uppercase tracking-wide hover:bg-accent transition-colors shrink-0"
              >
                Search
              </button>
            </form>

            {initialQ && (
              <p className="mt-3 text-[0.82rem] text-muted-foreground">
                {results.length} {results.length === 1 ? "product" : "products"} found
              </p>
            )}
          </div>
        </Shell>
      </div>

      {/* Results */}
      <div className="bg-white min-h-screen">
        <Shell className="py-8">
          {initialQ && results.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-2xl font-normal text-foreground">No products found</p>
              <p className="mt-3 text-[0.85rem] text-muted-foreground">
                Try another search term or explore our latest collection.
              </p>
              <a
                href="/collections/new-in"
                className="mt-6 inline-flex items-center border border-foreground px-6 py-2.5 text-[0.72rem] font-medium uppercase tracking-wide hover:bg-foreground hover:text-white transition-colors"
              >
                Shop New In
              </a>
            </div>
          ) : (
            <div className="grid gap-x-4 gap-y-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((p, i) => (
                <ProductCard key={p.slug} product={p} priority={i < 4} />
              ))}
            </div>
          )}
        </Shell>
      </div>
    </>
  );
}
