import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { getActiveProducts, getActiveCollections, onShopifyDataReady, isShopifyLoading, type Product } from "@/lib/products";
import { Shell } from "@/components/site/Section";
import { ProductCard } from "@/components/site/ProductCard";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute('/collections/$collectionSlug')({
  head: (ctx: any) => {
    const slug = ctx?.params?.collectionSlug;
    const collection = getActiveCollections().find((c) => c.slug === slug);
    const title = collection ? `${collection.title} — LAAF` : "Collection — LAAF";
    return {
      meta: [
        { title },
        { name: "description", content: collection?.description || "Explore LAAF collections." },
        { property: "og:title", content: title },
      ],
    };
  },
  component: CollectionPLP,
});

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

function sortProducts(list: Product[], sort: string): Product[] {
  switch (sort) {
    case "price-asc": return [...list].sort((a, b) => a.price - b.price);
    case "price-desc": return [...list].sort((a, b) => b.price - a.price);
    case "newest": return [...list].sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
    default: return list;
  }
}

function CollectionPLP() {
  const { collectionSlug } = Route.useParams();
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const loading = mounted && isShopifyLoading();

  useEffect(() => {
    setMounted(true);
    return onShopifyDataReady(() => setTick((t) => t + 1));
  }, []);

  const collection = getActiveCollections().find((c) => c.slug === collectionSlug);

  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    let list = getActiveProducts().filter((p) => p.collections.includes(collectionSlug as any));
    return sortProducts(list, sort);
  }, [collectionSlug, sort, tick]);

  if (loading && !collection) {
    return (
      <div className="py-24 text-center">
        <h1 className="font-serif text-[2.5rem] font-normal text-foreground">Loading collection...</h1>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="py-24 text-center">
        <h1 className="font-serif text-[2.5rem] font-normal text-foreground">Collection Not Found</h1>
        <p className="mt-4 text-muted-foreground">The collection you are looking for does not exist.</p>
        <a href="/collections" className="mt-8 inline-flex items-center text-[0.75rem] font-semibold uppercase tracking-wider border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors">
          View All Collections →
        </a>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-white py-3">
        <Shell>
          <nav className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <span className="mx-2">/</span>
            <a href="/collections" className="hover:text-foreground transition-colors">Collections</a>
            <span className="mx-2">/</span>
            <span className="text-foreground">{collection.title}</span>
          </nav>
        </Shell>
      </div>

      <div className="bg-white min-h-screen">
        <Shell className="py-8 md:py-12">
          {/* Collection heading */}
          <h1 className="font-serif text-[2rem] md:text-[2.5rem] font-normal text-foreground mb-1">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-[0.88rem] text-muted-foreground mb-6 max-w-lg">
              {collection.description}
            </p>
          )}

          {/* Filter / Sort bar */}
          <div className="flex items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
            <div className="flex items-center gap-4">
              <span className="text-[0.8rem] font-medium text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>

            {/* Right: sort */}
            <div className="flex items-center gap-3 ml-auto">
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

          {/* Product grid */}
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-2xl font-normal text-foreground">No products available in this collection yet.</p>
              <a href="/collections" className="mt-8 inline-flex items-center text-[0.75rem] font-semibold uppercase tracking-wider border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors">
                Explore Other Collections →
              </a>
            </div>
          ) : (
            <div className="grid gap-x-4 gap-y-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p, i) => (
                <ProductCard key={p.slug} product={p} priority={i < 4} />
              ))}
            </div>
          )}
        </Shell>
      </div>
    </>
  );
}

export default CollectionPLP;
