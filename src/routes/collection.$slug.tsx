import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  getProduct,
  formatPrice,
  formatCompareAt,
  getActiveProducts,
  onShopifyDataReady,
  isShopifyLoading,
} from "@/lib/products";
import { getReviewStats, type ReviewStats } from "@/lib/reviews";
import { Shell } from "@/components/site/Section";
import { ProductCard } from "@/components/site/ProductCard";
import { ReviewSection } from "@/components/site/ReviewSection";
import { useStore } from "@/lib/store";
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  RefreshCw,
  Shield,
  ChevronDown,
  Share2,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SHIPPING_CONFIG } from "@/lib/shipping";
import { laafLocation } from "@/lib/site";

export const Route = createFileRoute<"/collection/$slug">("/collection/$slug")({
  head: (ctx: any) => {
    const params = (ctx?.params || {}) as any;
    const product = getProduct(params["slug"] as string);
    return {
      meta: [
        { title: product ? `${product.name} — LAAF` : "Product — LAAF" },
        {
          name: "description",
          content: product ? product.summary : "Discover premium modest fashion at LAAF",
        },
        { property: "og:title", content: product ? product.name : "LAAF Product" },
      ],
    };
  },
  component: ProductPage,
});

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < Math.floor(rating)
                ? "fill-[#f5a623] text-[#f5a623]"
                : "fill-none text-muted-foreground/30",
            )}
            strokeWidth={1}
          />
        ))}
      </div>
      <span className="text-[0.78rem] text-muted-foreground">
        {rating} ({count} reviews)
      </span>
    </div>
  );
}

function AccordionItem({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-t border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-[0.78rem] font-semibold uppercase tracking-wide text-foreground hover:text-accent transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {title}
        <span className={cn("transition-transform duration-300", isOpen && "rotate-180")}>
          <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-4 text-[0.82rem] text-muted-foreground leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 w-full max-w-md bg-white p-6 shadow-lg overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-foreground">Size & Height Guide</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[0.75rem] font-semibold uppercase tracking-wider text-foreground mb-2">
              Find Your Abaya Length (By Height)
            </h3>
            <p className="text-[0.72rem] text-muted-foreground mb-3">
              Measure from the top of your shoulder down to your feet to find the perfect length.
              Choose a longer length if you plan to wear heels.
            </p>
            <table className="w-full text-[0.72rem] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-semibold text-foreground">Your Height</th>
                  <th className="py-2 text-left font-semibold text-foreground">
                    Recommended Length
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ht: `4'11" – 5'1" (150–155 cm)`, len: `50"` },
                  { ht: `5'2" – 5'3" (157–160 cm)`, len: `52"` },
                  { ht: `5'4" – 5'5" (162–165 cm)`, len: `54"` },
                  { ht: `5'6" – 5'7" (167–170 cm)`, len: `56"` },
                  { ht: `5'8" – 5'9" (172–175 cm)`, len: `58"` },
                  { ht: `5'10" – 6'0" (178–183 cm)`, len: `60"` },
                ].map((row) => (
                  <tr key={row.len} className="border-b border-border last:border-0">
                    <td className="py-2 text-muted-foreground">{row.ht}</td>
                    <td className="py-2 font-medium text-foreground">{row.len}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-[0.72rem] text-muted-foreground leading-relaxed">
              All LAAF abayas are{" "}
              <span className="font-medium text-foreground">one-size-fits-all</span> with a relaxed,
              loose silhouette designed for modesty. Select your preferred length above — no
              separate chest or waist sizing is required.
            </p>
          </div>
        </div>

        <p className="mt-5 text-[0.68rem] text-muted-foreground border-t border-border pt-3">
          For custom lengths or bespoke fitting advice, please message our styling concierge on
          WhatsApp.
        </p>
      </div>
    </div>
  );
}

function ProductPage() {
  const params = useParams({ from: Route.id as any });
  const [catalogReady, setCatalogReady] = useState(false);
  useEffect(() => onShopifyDataReady(() => setCatalogReady(true)), []);
  const product = getProduct(params.slug as string);
  const { bag, addToBag, toggleWishlist, isWished, hydrated, setBagOpen } = useStore();
  const [activeImg, setActiveImg] = useState(0);
  const [length, setLength] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [addedFlash, setAddedFlash] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [lengthError, setLengthError] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    average: 0,
    count: 0,
    breakdown: [0, 0, 0, 0, 0],
  });

  // Fetch real review stats from Judge.me
  useEffect(() => {
    if (!product?.slug) return;
    let cancelled = false;
    getReviewStats(product.slug).then((stats) => {
      if (!cancelled) setReviewStats(stats);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [product?.slug]);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setActiveAccordion(0);
    }
  }, []);

  if (!product && (isShopifyLoading() || !catalogReady)) {
    return (
      <Shell className="py-20">
        <p className="text-muted-foreground">Loading product...</p>
      </Shell>
    );
  }

  if (!product) {
    return (
      <Shell className="py-20">
        <p className="text-muted-foreground">Product not found.</p>
        <Link to="/" className="mt-4 inline-block text-sm underline hover:text-accent">
          Go home
        </Link>
      </Shell>
    );
  }

  const wished = hydrated && isWished(product.slug);
  const compareAt = formatCompareAt(product);
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  const related = getActiveProducts()
    .filter(
      (p) => p.slug !== product.slug && p.collections.some((c) => product.collections.includes(c)),
    )
    .slice(0, 4);
  const lengthOptions =
    product.shopifyVariants
      ?.flatMap((variant) => {
        const option = variant.selectedOptions.find((selected) =>
          selected.name.toLowerCase().includes("length"),
        );
        if (option)
          return [
            { value: option.value.replace(/"/g, ""), availableForSale: variant.availableForSale },
          ];
        const titleMatch = variant.title.match(/\b(50|52|54|56|58|60)\s*"?/);
        return titleMatch
          ? [{ value: titleMatch[1]!, availableForSale: variant.availableForSale }]
          : [];
      })
      .filter(
        (option, index, options) =>
          options.findIndex((candidate) => candidate.value === option.value) === index,
      ) ?? [];
  const hasAvailableVariant =
    product.shopifyVariants?.some((variant) => variant.availableForSale) ?? false;

  const buyNow = useCallback(() => {
    if (product.category === "abayas" && !length) {
      setLengthError("Please select an Abaya length.");
      return;
    }
    if (!hasAvailableVariant) {
      setLengthError("This product is currently out of stock.");
      return;
    }
    setLengthError("");

    // Compute the updated bag and persist to localStorage SYNCHRONOUSLY
    // before the full-page reload destroys the React tree.
    // addToBag may not flush its localStorage write before navigation,
    // so we do it manually here.
    const BAG_KEY = "noorat.bag";
    let currentBag: { slug: string; size: string; length?: string; qty: number }[] = [];
    try { currentBag = JSON.parse(window.localStorage.getItem(BAG_KEY) || "[]"); } catch {}
    const found = currentBag.find(
      (i) => i.slug === product.slug && i.size === "One Size" && i.length === length,
    );
    const newBag = found
      ? currentBag.map((i) =>
          i.slug === product.slug && i.size === "One Size" && i.length === length
            ? { ...i, qty: i.qty + qty }
            : i,
        )
      : [...currentBag, length !== undefined
          ? { slug: product.slug, size: "One Size", length, qty }
          : { slug: product.slug, size: "One Size", qty }];
    try { window.localStorage.setItem(BAG_KEY, JSON.stringify(newBag)); } catch {}

    addToBag(product.slug, "One Size", length, qty);

    window.location.href = "/checkout";
  }, [product, length, qty, addToBag, hasAvailableVariant]);

  const onAdd = () => {
    if (product.category === "abayas" && !length) {
      setLengthError("Please select an Abaya length.");
      return;
    }
    if (!hasAvailableVariant) {
      setLengthError("This product is currently out of stock.");
      return;
    }
    setLengthError("");
    addToBag(product.slug, "One Size", length, qty);
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 2000);
    setBagOpen(true);
  };

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    image: product.images.map((i) => i.src),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-white py-3">
        <Shell>
          <nav className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">
            <a href="/" className="hover:text-foreground transition-colors">
              Home
            </a>
            <span className="mx-2">/</span>
            <a href="/collection" className="hover:text-foreground transition-colors">
              Shop
            </a>
            <span className="mx-2">/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </Shell>
      </div>

      <div className="bg-white">
        <Shell className="py-8 md:py-12">
          <div className="flex flex-col gap-8 lg:gap-12 lg:flex-row">
            {/* ── Left: images ───────────────────────── */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row lg:flex-1">
              {/* Thumbnail column */}
              {product.images.length > 1 && (
                <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible sm:w-20 shrink-0">
                  {product.images.map((img, i) => (
                    <button
                      key={img.src}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        "shrink-0 overflow-hidden border-2 transition-all duration-200",
                        i === activeImg
                          ? "border-foreground"
                          : "border-transparent hover:border-border",
                      )}
                      aria-label={`View image ${i + 1}`}
                      aria-pressed={i === activeImg}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        width={img.width}
                        height={img.height}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[3/4] w-16 sm:w-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="relative flex-1 overflow-hidden">
                {product.isSale && discount && (
                  <span className="absolute left-3 top-3 z-10 bg-sale px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-white">
                    -{discount}% OFF
                  </span>
                )}
                {product.isNew && (
                  <span className="absolute left-3 top-10 z-10 bg-accent px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-white">
                    New
                  </span>
                )}
                <img
                  src={(product.images[activeImg] ?? product.images[0])!.src}
                  alt={(product.images[activeImg] ?? product.images[0])!.alt}
                  width={1008}
                  height={1408}
                  loading="eager"
                  decoding="async"
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            </div>

            {/* ── Right: product info ─────────────────── */}
            <div className="flex flex-col lg:w-[440px] lg:shrink-0">
              {/* Name */}
              <h1 className="mt-3 font-serif text-[1.7rem] md:text-[2.1rem] font-normal leading-tight text-foreground">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mt-2">
                <StarDisplay rating={reviewStats.average} count={reviewStats.count} />
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3 flex-wrap">
                <span className="text-[1.4rem] font-semibold text-foreground">
                  {formatPrice(product)}
                </span>
                {compareAt && (
                  <span className="text-[0.95rem] text-muted-foreground line-through">
                    {compareAt}
                  </span>
                )}
                {discount && (
                  <span className="bg-sale/10 text-sale text-[0.72rem] font-semibold px-2 py-0.5">
                    Save {discount}%
                  </span>
                )}
              </div>

              {/* Summary */}
              <p className="mt-4 text-[0.85rem] leading-relaxed text-muted-foreground">
                {product.summary}
              </p>

              {/* Colour */}
              <div className="mt-5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-foreground mb-2">
                  Colour:{" "}
                  <span className="font-normal text-muted-foreground">{product.colour}</span>
                </p>
              </div>

              {/* Length Selector (for Abayas only) */}
              {product.category === "abayas" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-foreground">
                      Abaya Length
                    </p>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="text-[0.7rem] font-semibold text-foreground border border-border px-3 py-1.5 hover:border-foreground hover:bg-muted transition-colors"
                    >
                      Size Guide →
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {lengthOptions.map(({ value: len, availableForSale }) => (
                      <button
                        key={len}
                        type="button"
                        onClick={() => {
                          if (!availableForSale) return;
                          setLength(len);
                          setLengthError("");
                        }}
                        aria-pressed={len === length}
                        disabled={!availableForSale}
                        className={cn(
                          "h-10 min-w-10 px-3 border text-[0.78rem] font-medium transition-all duration-150",
                          len === length
                            ? "border-foreground bg-foreground text-white"
                            : availableForSale
                              ? "border-border text-foreground hover:border-foreground"
                              : "border-border text-muted-foreground/40 line-through cursor-not-allowed",
                        )}
                      >
                        {len}&quot;
                      </button>
                    ))}
                  </div>
                  {lengthOptions.length === 0 && (
                    <p className="text-[0.65rem] text-sale mt-1.5">
                      No length variants are available for this product.
                    </p>
                  )}
                </div>
              )}

              {lengthError && <p className="text-[0.65rem] text-sale mt-3">{lengthError}</p>}

              {/* Qty + Add to Cart */}
              <div className="mt-6 flex gap-3">
                <div className="flex items-center border border-border">
                  <button
                    type="button"
                    className="grid h-12 w-10 place-items-center text-lg hover:bg-muted transition-colors"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-[0.85rem] font-medium">{qty}</span>
                  <button
                    type="button"
                    className="grid h-12 w-10 place-items-center text-lg hover:bg-muted transition-colors"
                    onClick={() => setQty(qty + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onAdd}
                  disabled={!hasAvailableVariant}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3.5 text-[0.72rem] font-semibold uppercase tracking-wide transition-all duration-200",
                    !hasAvailableVariant
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : addedFlash
                        ? "bg-accent text-white"
                        : "bg-foreground text-white hover:bg-accent",
                  )}
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={2} />
                  {!hasAvailableVariant ? "Out of Stock" : addedFlash ? "Added!" : "Add to Cart"}
                </button>
              </div>

              {/* Wishlist + Share */}
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.slug)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 border py-3 text-[0.72rem] font-medium uppercase tracking-wide transition-colors",
                    wished
                      ? "border-sale text-sale bg-sale/5"
                      : "border-border text-foreground hover:border-foreground",
                  )}
                >
                  <Heart
                    className={cn("h-4 w-4", wished && "fill-sale text-sale")}
                    strokeWidth={1.5}
                  />
                  {wished ? "Wishlisted" : "Add to Wishlist"}
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 border border-border px-4 py-3 text-[0.72rem] font-medium uppercase tracking-wide hover:bg-muted transition-colors"
                  aria-label="Share"
                  onClick={() =>
                    navigator
                      .share?.({ title: product.name, url: window.location.href })
                      .catch(() => {})
                  }
                >
                  <Share2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Buy It Now */}
              <button
                type="button"
                onClick={buyNow}
                disabled={!hasAvailableVariant}
                className={cn(
                  "mt-3 flex w-full items-center justify-center gap-2 py-3.5 text-[0.72rem] font-semibold uppercase tracking-wide transition-colors",
                  hasAvailableVariant
                    ? "bg-accent text-white hover:bg-accent/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Zap className="h-4 w-4" strokeWidth={2} />
                Buy It Now
              </button>

              {/* WhatsApp Sizing Help */}
              <div className="mt-4 text-center">
                <p className="text-[0.72rem] text-muted-foreground mb-1.5">
                  Need help choosing your length?
                </p>
                <a
                  href={`https://wa.me/${laafLocation.phoneRaw}?text=${encodeURIComponent(
                    `Hi LAAF! I am interested in the ${product.name} and would like help selecting the correct length. Here are my details...`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-foreground hover:text-accent transition-colors"
                >
                  Consult via WhatsApp →
                </a>
              </div>

              {/* Trust icons */}
              <div className="mt-6 grid grid-cols-3 gap-3 border-y border-border py-5">
                {[
                  { icon: Truck, text: "COD Available" },
                  { icon: RefreshCw, text: "7-Day Easy Returns" },
                  { icon: Shield, text: "100% Authentic" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center text-center gap-1.5">
                    <Icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
                    <span className="text-[0.6rem] text-muted-foreground leading-tight">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Accordions */}
              <div className="mt-2">
                <AccordionItem
                  title="Product Details"
                  isOpen={activeAccordion === 0}
                  onToggle={() => setActiveAccordion(activeAccordion === 0 ? null : 0)}
                >
                  <ul className="list-disc pl-4 space-y-1.5">
                    {product.design.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  <p className="mt-3 font-medium text-[0.78rem]">
                    Fabric:{" "}
                    <span className="font-normal text-muted-foreground">
                      Premium Nida/Crepe (Opaque, lightweight, non-see-through, luxury drape)
                    </span>
                  </p>
                </AccordionItem>
                <AccordionItem
                  title="Shipping & Delivery"
                  isOpen={activeAccordion === 1}
                  onToggle={() => setActiveAccordion(activeAccordion === 1 ? null : 1)}
                >
                  <p>
                    We carefully prepare every LAAF order for dispatch. Delivery details and
                    applicable shipping charges are shown during checkout before you place your
                    order.
                  </p>
                  <p className="mt-2">
                    For any help with your order or delivery, contact LAAF through WhatsApp.
                  </p>
                </AccordionItem>
                <AccordionItem
                  title="Returns & Exchanges"
                  isOpen={activeAccordion === 2}
                  onToggle={() => setActiveAccordion(activeAccordion === 2 ? null : 2)}
                >
                  <p>
                    Easy 7-day returns. Item must be unused, unwashed, and in original packaging
                    with tags intact. Exchange or full refund available.
                  </p>
                </AccordionItem>
                <AccordionItem
                  title="Care Instructions"
                  isOpen={activeAccordion === 3}
                  onToggle={() => setActiveAccordion(activeAccordion === 3 ? null : 3)}
                >
                  <p className="text-[0.72rem] text-muted-foreground italic">
                    Care details for this product will be available soon.
                  </p>
                </AccordionItem>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-12 md:mt-16">
            <ReviewSection productId={product.slug} shopifyId={product.shopifyId} />
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div className="mt-16 md:mt-20">
              <h2 className="font-serif text-[1.5rem] md:text-[2rem] font-normal text-foreground mb-8">
                You May Also Like
              </h2>
              <div className="grid gap-x-5 gap-y-10 grid-cols-2 lg:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </div>
          )}
        </Shell>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-border md:hidden">
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 min-w-0">
            <p className="text-[0.78rem] font-semibold text-foreground truncate">{product.name}</p>
            <p className="text-[0.72rem] text-accent font-semibold">{formatPrice(product)}</p>
          </div>
          <button
            type="button"
            onClick={buyNow}
            disabled={!hasAvailableVariant}
            className={cn(
              "flex items-center justify-center gap-1.5 px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-wide transition-colors",
              hasAvailableVariant
                ? "bg-accent text-white hover:bg-accent/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Zap className="h-3.5 w-3.5" strokeWidth={2} />
            Buy Now
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={!hasAvailableVariant}
            className={cn(
              "flex items-center justify-center gap-1.5 px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-wide transition-all",
              !hasAvailableVariant
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : addedFlash ? "bg-accent text-white" : "bg-foreground text-white hover:bg-accent",
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2} />
            {!hasAvailableVariant ? "Out of Stock" : addedFlash ? "Added!" : "Add"}
          </button>
        </div>
      </div>

      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}
