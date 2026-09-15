import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { formatPrice, formatCompareAt, type Product } from "@/lib/products";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LENGTHS = ["50", "52", "54", "56", "58", "60"];

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5 pt-1">
      <div className="stars flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < full
                ? "fill-[#f5a623] text-[#f5a623]"
                : i === full && half
                  ? "fill-[#f5a623]/50 text-[#f5a623]"
                  : "fill-none text-muted-foreground/40",
            )}
            strokeWidth={1}
          />
        ))}
      </div>
      <span className="text-[0.62rem] text-muted-foreground leading-none">({count})</span>
    </div>
  );
}

export function ProductCard({
  product,
  className,
  priority = false,
  reviewRating,
  reviewCount,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
  reviewRating?: number;
  reviewCount?: number;
}) {
  const { toggleWishlist, isWished, hydrated, addToBag, setBagOpen } = useStore();
  const [showLengths, setShowLengths] = useState(false);
  const primary = product.images?.[0];
  const secondary = product.images?.[1];
  const wished = hydrated && isWished(product.slug);
  const compareAt = formatCompareAt(product);
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const allVariantsUnavailable =
    product.shopifyVariants &&
    product.shopifyVariants.length > 0 &&
    product.shopifyVariants.every((v) => !v.availableForSale);

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLengths(true);
  };

  const isLengthAvailable = (len: string) => {
    if (!product.shopifyVariants || product.shopifyVariants.length === 0) return false;
    return product.shopifyVariants.some((v) => 
      v.availableForSale &&
      (v.selectedOptions.some(
        (opt) =>
          opt.name.toLowerCase().includes("length") &&
          (opt.value === `${len}"` || opt.value === len),
      ) ||
      v.title.includes(`${len}"`) ||
      v.title.includes(len))
    );
  };

  const handleSelectLength = (e: React.MouseEvent, selectedLength: string) => {
    e.preventDefault();
    e.stopPropagation();
    addToBag(product.slug, "One Size", selectedLength, 1);
    setBagOpen(true);
    setShowLengths(false);
  };

  return (
    <article className={cn("group relative flex flex-col h-full justify-between", className)}>
      <div className="relative">
        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="inline-flex items-center bg-accent px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-white leading-4">
              New
            </span>
          )}
          {product.isSale && discount && (
            <span className="inline-flex items-center bg-sale px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-white leading-4">
              -{discount}%
            </span>
          )}
          {allVariantsUnavailable && (
            <span className="inline-flex items-center bg-foreground/80 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-white leading-4">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wished}
          className={cn(
            "absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            wished && "opacity-100",
          )}
        >
          <Heart
            className={cn("h-4 w-4", wished ? "fill-sale text-sale" : "text-foreground")}
            strokeWidth={1.5}
          />
        </button>

        {/* Image container */}
        <Link
          to="/collection/$slug"
          params={{ slug: product.slug }}
          className="block overflow-hidden bg-secondary relative aspect-[3/4]"
          aria-label={product.name}
          tabIndex={-1}
        >
          {primary ? (
            <img
              src={primary.src}
              alt={primary.alt}
              width={primary.width}
              height={primary.height}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="aspect-[3/4] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <div className="aspect-[3/4] w-full bg-secondary flex items-center justify-center">
              <span className="text-[0.7rem] text-muted-foreground">Image coming soon</span>
            </div>
          )}
          {secondary && (
            <img
              src={secondary.src}
              alt=""
              aria-hidden="true"
              width={secondary.width}
              height={secondary.height}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 aspect-[3/4] h-full w-full object-cover opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
            />
          )}

          {/* Quick add button (Desktop hover only) */}
          <div
            className={cn(
              "product-card-add hidden lg:flex items-center justify-center gap-1",
              showLengths && "bg-white text-foreground"
            )}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {!showLengths ? (
              <button
                type="button"
                onClick={allVariantsUnavailable ? undefined : handleQuickAddClick}
                disabled={allVariantsUnavailable}
                className={cn(
                  "flex h-full w-full items-center justify-center gap-2",
                  allVariantsUnavailable && "text-muted-foreground/50 cursor-not-allowed"
                )}
                aria-label={allVariantsUnavailable ? `${product.name} is out of stock` : `Quick add options for ${product.name}`}
              >
                <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2} />
                {allVariantsUnavailable ? "Out of Stock" : "Add to Cart"}
              </button>
            ) : (
              <div className="flex items-center justify-around w-full px-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <span className="text-[0.62rem] text-muted-foreground mr-1.5 font-bold">LENGTH:</span>
                {LENGTHS.map((len) => {
                  const available = isLengthAvailable(len);
                  return (
                    <button
                      key={len}
                      type="button"
                      disabled={!available}
                      onClick={(e) => {
                        if (available) handleSelectLength(e, len);
                      }}
                      className={cn(
                        "px-2 py-1 text-[0.72rem] font-bold border transition-colors",
                        available
                          ? "border-border hover:border-foreground hover:bg-foreground hover:text-white"
                          : "border-border/50 text-muted-foreground/30 line-through cursor-not-allowed"
                      )}
                    >
                      {len}"
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLengths(false); }}
                  className="p-1 text-muted-foreground hover:text-foreground ml-1.5"
                  aria-label="Close length selector"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Product info */}
      <div className="pt-3 px-0.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <StarRating rating={reviewRating ?? product.rating} count={reviewCount ?? product.reviewCount} />

          {/* Name */}
          <h3 className="mt-2 text-[0.85rem] font-normal leading-snug text-foreground line-clamp-2">
            <Link
              to="/collection/$slug"
              params={{ slug: product.slug }}
              className="hover:text-accent transition-colors"
            >
              {product.name}
            </Link>
          </h3>

          {/* Price row */}
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="text-[0.9rem] font-semibold text-foreground">
              {formatPrice(product)}
            </span>
            {compareAt && (
              <span className="text-[0.78rem] font-normal text-muted-foreground line-through">
                {compareAt}
              </span>
            )}
            {discount && (
              <span className="text-[0.7rem] font-semibold text-sale">
                Save {discount}%
              </span>
            )}
          </div>
        </div>

        {/* Mobile Quick Add removed — users go to PDP for length selection */}
      </div>
    </article>
  );
}