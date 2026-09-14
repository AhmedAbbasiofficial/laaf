import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { getProduct, formatPrice } from "@/lib/products";
import { Shell } from "@/components/site/Section";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — LAAF" },
      { name: "description", content: "Your saved LAAF pieces — view and manage your wishlist." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, toggleWishlist, addToBag, setBagOpen, hydrated } = useStore();

  const items = wishlist
    .map((slug) => getProduct(slug))
    .filter((p): p is NonNullable<ReturnType<typeof getProduct>> => p !== undefined);

  if (!hydrated) {
    return (
      <Shell className="py-20 md:py-28">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </Shell>
    );
  }

  return (
    <Shell className="py-14 md:py-20">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 border-b border-border pb-5">
        <div>
          <p className="eyebrow text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
            Your Saved Pieces
          </p>
          <h1 className="font-serif text-[1.8rem] md:text-[2.2rem] font-normal text-foreground leading-tight">
            Wishlist
            {items.length > 0 && (
              <span className="ml-3 text-[1.1rem] font-sans font-normal text-muted-foreground">
                ({items.length})
              </span>
            )}
          </h1>
        </div>
        <Link
          to="/collection"
          className="hidden sm:inline-flex items-center gap-1.5 border border-border px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-foreground hover:bg-muted transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="h-12 w-12 text-border mb-5" strokeWidth={1} />
          <h2 className="font-serif text-xl text-foreground mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-8">
            Save pieces you love by tapping the heart icon on any product.
          </p>
          <Link
            to="/collection"
            className="inline-flex items-center justify-center gap-2 bg-foreground text-white px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-wider hover:bg-accent transition-colors"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2} />
            Shop All Abayas
          </Link>
        </div>
      )}

      {/* Product Grid */}
      {items.length > 0 && (
        <div className="grid gap-x-5 gap-y-10 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => {
            const img = product.images[0]!;
            const discount = product.compareAtPrice
              ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
              : null;

            return (
              <article key={product.slug} className="group relative flex flex-col">
                {/* Remove from wishlist */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.slug)}
                  className={cn(
                    "absolute right-2.5 top-2.5 z-10 grid h-8 w-8 place-items-center bg-white/90 shadow-sm",
                    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200",
                  )}
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <X className="h-3.5 w-3.5 text-foreground" strokeWidth={1.5} />
                </button>

                {/* Sale badge */}
                {discount && (
                  <span className="absolute left-2.5 top-2.5 z-10 bg-sale px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wider text-white">
                    -{discount}%
                  </span>
                )}

                {/* Image */}
                <Link
                  to="/collection/$slug"
                  params={{ slug: product.slug }}
                  className="block overflow-hidden bg-secondary"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    width={img.width}
                    height={img.height}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  />
                </Link>

                {/* Info */}
                <div className="pt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[0.83rem] font-normal leading-snug text-foreground line-clamp-2 mb-1">
                      <Link
                        to="/collection/$slug"
                        params={{ slug: product.slug }}
                        className="hover:text-accent transition-colors"
                      >
                        {product.name}
                      </Link>
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[0.88rem] font-semibold text-foreground">
                        {formatPrice(product)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-[0.75rem] text-muted-foreground line-through">
                          PKR {product.compareAtPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick add */}
                  <button
                    type="button"
                    onClick={() => {
                      addToBag(product.slug, "M", product.category === "abayas" ? "54" : undefined, 1);
                      setBagOpen(true);
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 border border-foreground/20 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-white transition-all"
                  >
                    <ShoppingBag className="h-3 w-3" strokeWidth={2} />
                    Add to Cart
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Continue shopping — mobile */}
      {items.length > 0 && (
        <div className="mt-12 flex justify-center sm:hidden">
          <Link
            to="/collection"
            className="inline-flex items-center gap-1.5 border border-border px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-foreground hover:bg-muted transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </Shell>
  );
}
