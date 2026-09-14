import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { Shell } from "@/components/site/Section";
import { HeroSlider } from "@/components/site/HeroSlider";
import { FAQSection } from "@/components/site/FAQSection";
import { TwoProductFeatureSection } from "@/components/site/TwoProductFeatureSection";
import { EditorialBrandSection } from "@/components/site/EditorialBrandSection";
import {
  getActiveProducts,
  getActiveCollections,
  onShopifyDataReady,
  isShopifyLoading,
} from "@/lib/products";
import { useState, useEffect } from "react";
import heroAbaya from "@/assets/hero-abaya.jpg";
import detailFloral from "@/assets/detail-floral.jpg";
import detailBronze from "@/assets/detail-bronze.jpg";
import editorialWide from "@/assets/editorial-wide.jpg";
import story from "@/assets/story.jpg";
import bronze1 from "@/assets/product-bronze-1.jpg";
import floral1 from "@/assets/product-floral-1.jpg";
import floral2 from "@/assets/product-floral-2.jpg";
import lrgeimge from "@/assets/lrgeimge.jpg";
import detailBlack from "@/assets/detail-black.jpg";
import { Star, RefreshCw, Scissors, Banknote } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LAAF — Premium Modest Fashion | Abayas & Hijabs" },
      {
        name: "description",
        content:
          "LAAF: Pakistan's premium abaya and hijab brand. Explore trendy Islamic women wear collections and shop online with ease.",
      },
      { property: "og:title", content: "LAAF — Premium Modest Fashion" },
      {
        property: "og:description",
        content: "Premium modern modest fashion with refined contemporary elegance.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

// Featured products for home — resolved at render time so Shopify data is available

const trustBadges = [
  { icon: Scissors, title: "CUSTOM SIZING", sub: "Tailored to your size" },
  { icon: Banknote, title: "COD AVAILABLE", sub: "Pay at your doorstep" },
  { icon: RefreshCw, title: "EASY RETURNS", sub: "7-day hassle-free returns" },
];

const testimonials = [
  {
    name: "Fatima A.",
    rating: 5,
    text: "Absolutely stunning quality! The embroidery is so detailed and the fabric is premium. Will definitely order again.",
    product: "Bronze Botanical Abaya",
  },
  {
    name: "Sara M.",
    rating: 5,
    text: "Fast delivery, beautiful packaging, and the abaya is even more gorgeous in person. Highly recommend LAAF!",
    product: "Floral Embroidered Abaya",
  },
  {
    name: "Nadia K.",
    rating: 5,
    text: "The perfect abaya for special occasions. I received so many compliments. The craftsmanship is exceptional.",
    product: "Draped Floral Abaya",
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-[#f5a623] text-[#f5a623]" strokeWidth={1} />
      ))}
    </div>
  );
}

function Index() {
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return onShopifyDataReady(() => setTick((t) => t + 1));
  }, []);

  const featured = getActiveProducts().slice(0, 4);
  const collectionsList = getActiveCollections().filter((c) => c.slug !== "frontpage");
  const loading = mounted && isShopifyLoading();

  return (
    <>
      {/* ── HERO SLIDER ──────────────────────────────────────── */}
      <HeroSlider />

      {/* ── TRUST BADGES ─────────────────────────────────────── */}
      {/* ISSUE 3 ROOT CAUSE:
       * This information strip is intentionally kept as a single horizontal row at
       * mobile, rather than allowing the desktop multi-column layout to wrap into
       * accidental stacked columns. The strip uses a compact, consistent 3-item
       * grid with a constrained content width so it behaves like a premium
       * storefront trust bar instead of a fragmented text stack.
       */}
      <div className="border-b border-border bg-white">
        <Shell>
          <div className="grid grid-cols-3 divide-x divide-border">
            {trustBadges.map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="flex min-w-0 flex-col items-center gap-1.5 px-1.5 py-4 text-center sm:px-4 md:gap-2 md:py-6 md:px-6"
              >
                <Icon
                  className="h-5 w-5 shrink-0 text-foreground md:h-7 md:w-7"
                  strokeWidth={1.25}
                />
                <div className="mt-0.5 min-w-0 space-y-1 md:mt-1.5 md:space-y-1.5">
                  <p className="text-[0.56rem] font-bold uppercase leading-tight tracking-[0.08em] text-foreground sm:text-[0.65rem] md:text-[0.8rem] md:tracking-widest">
                    {title}
                  </p>
                  <p className="text-[0.6rem] leading-tight text-muted-foreground sm:text-[0.7rem] md:text-[0.8rem]">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Shell>
      </div>

      {/* ── NEW ARRIVALS ─────────────────────────────────────── */}
      <section className="py-8 md:py-12 bg-white">
        <Shell>
          <Reveal>
            <div className="flex items-end justify-between mb-5">
              <div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-accent">
                  New Season
                </span>
                <h2 className="font-serif text-[1.8rem] md:text-[2.4rem] font-normal mt-1 text-foreground">
                  New Arrivals
                </h2>
              </div>
              <a
                href="/collection?fresh=1"
                className="hidden sm:inline-flex items-center text-[0.72rem] font-medium uppercase tracking-wide text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors"
              >
                View All →
              </a>
            </div>
          </Reveal>
          <div className="grid gap-x-4 gap-y-6 grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-secondary animate-pulse" />
              ))
            ) : featured.length > 0 ? (
              featured.map((product, i) => (
                <Reveal key={product.slug} delay={i * 80}>
                  <ProductCard product={product} priority={i < 2} />
                </Reveal>
              ))
            ) : (
              <div className="col-span-2 lg:col-span-4 py-12 text-center text-muted-foreground text-sm">
                No products available yet.
              </div>
            )}
          </div>
          <div className="mt-5 text-center sm:hidden">
            <a
              href="/collection?fresh=1"
              className="inline-flex items-center text-[0.72rem] font-medium uppercase tracking-wide text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors"
            >
              View All New Arrivals →
            </a>
          </div>
        </Shell>
      </section>

      {/* ── FEATURED PRODUCTS ───────────────────────────────── */}
      <TwoProductFeatureSection />

      {/* ── EDITORIAL BRAND STORY ──────────────────────────── */}
      <EditorialBrandSection
        eyebrow="Designed with Purpose"
        heading="Crafted with Intention"
        description="At LAAF, every piece is created with a balance of modesty, comfort, and refined style. We believe fashion should feel as beautiful as it looks — thoughtfully crafted with graceful silhouettes, premium fabrics, and details that bring together comfort and timeless elegance."
        mainImage={{
          src: lrgeimge,
          alt: "LAAF premium abaya editorial, elegant modest fashion",
          width: 1440,
          height: 1808,
        }}
        secondaryImage={{
          src: detailBlack,
          alt: "LAAF black abaya sleeve detail with ruffled cuffs",
          width: 1008,
          height: 1008,
        }}
        ctaLabel="Shop now"
        ctaUrl="/collection"
      />

      {/* ISSUE 1 ROOT CAUSE:
       * The collection grid was structured as a compact 2-column mobile layout from
       * the start, with wider desktop spans added on larger breakpoints. The key
       * fix was not a random media query; it was keeping the grid intentionally
       * compact on small screens and only expanding the cards to larger spans at
       * desktop sizes. This avoids the full-width one-by-one stack while keeping
       * the premium editorial composition intact.
       */}
      {/* ── EXPLORE COLLECTIONS ───────────────────────────────────────── */}
      <section className="py-10 md:py-16 bg-muted/30">
        <Shell>
          <Reveal>
            <div className="flex flex-col items-center text-center mb-8">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent">
                Explore LAAF
              </span>
              <h2 className="font-serif text-[2rem] md:text-[2.8rem] font-normal mt-2 text-foreground">
                The Collections
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-2 sm:gap-2 md:gap-4 lg:grid-cols-12">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-secondary animate-pulse lg:col-span-6" />
              ))
            ) : collectionsList.length > 0 ? (
              <>
                {/* Row 1: 2 large blocks (6 cols each on desktop) */}
                {collectionsList.slice(0, 2).map((col, i) => (
                  <Reveal
                    key={col.slug}
                    delay={i * 100}
                    className="min-h-0 overflow-hidden rounded-none aspect-[4/5] lg:col-span-6 lg:aspect-auto lg:h-[500px]"
                  >
                    <Link
                      to={`/collections/${col.slug}`}
                      className="group relative flex h-full w-full overflow-hidden bg-secondary"
                    >
                      <img
                        src={col.heroImage}
                        alt={col.title}
                        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/25 transition-colors duration-500 group-hover:bg-black/40" />
                      <div className="absolute inset-x-0 bottom-0 z-10 p-3 text-left sm:p-6 md:p-8">
                        <h3 className="font-serif text-[0.72rem] leading-tight tracking-wide text-white sm:text-[1.1rem] md:text-[2.2rem]">
                          {col.title}
                        </h3>
                      </div>
                    </Link>
                  </Reveal>
                ))}

                {/* Row 2: 2 medium blocks (6 cols each on desktop) */}
                {collectionsList.slice(2, 4).map((col, i) => (
                  <Reveal
                    key={col.slug}
                    delay={(i + 2) * 100}
                    className={`min-h-0 overflow-hidden rounded-none aspect-[4/5] lg:col-span-6 lg:aspect-auto lg:h-[450px]${i === 0 ? " collection-card-third" : ""}`}
                  >
                    <Link
                      to={`/collections/${col.slug}`}
                      className="group relative flex h-full w-full overflow-hidden bg-secondary"
                    >
                      <img
                        src={col.heroImage}
                        alt={col.title}
                        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/25 transition-colors duration-500 group-hover:bg-black/40" />
                      <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 text-left sm:p-4 md:p-6">
                        <h3 className="font-serif text-[0.68rem] leading-tight tracking-wide text-white sm:text-[0.95rem] md:text-[1.8rem]">
                          {col.title}
                        </h3>
                      </div>
                    </Link>
                  </Reveal>
                ))}

                {/* Row 3: 1 full-width block (12 cols on desktop) */}
                {collectionsList.slice(4, 5).map((col) => (
                  <Reveal
                    key={col.slug}
                    delay={400}
                    className="min-h-0 overflow-hidden rounded-none col-span-2 h-[200px] collection-card-fifth lg:col-span-12 lg:h-[450px]"
                  >
                    <Link
                      to={`/collections/${col.slug}`}
                      className="group relative flex h-full w-full overflow-hidden bg-secondary"
                    >
                      <img
                        src={col.heroImage}
                        alt={col.title}
                        className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/25 transition-colors duration-500 group-hover:bg-black/40" />
                      <div className="absolute inset-x-0 bottom-0 z-10 p-3 text-left sm:p-4 md:p-8">
                        <h3 className="font-serif text-[0.72rem] leading-tight tracking-wide text-white sm:text-[1.1rem] md:text-[2.2rem]">
                          {col.title}
                        </h3>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </>
            ) : (
              <div className="col-span-2 py-12 text-center text-muted-foreground text-sm">
                No collections available yet.
              </div>
            )}
          </div>
        </Shell>
      </section>

      {/* ── EDITORIAL BANNER ─────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ height: "420px" }}>
        <img
          src={editorialWide}
          alt="LAAF luxury modest fashion editorial"
          width={1920}
          height={1088}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
          }}
        />
        <div className="relative z-10 flex h-full items-center">
          <Shell>
            <Reveal className="max-w-lg text-white">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-white/70">
                Craftsmanship
              </span>
              <h2 className="font-serif text-[2rem] md:text-[2.8rem] font-normal leading-[1.1] mt-3">
                Elegance lies in
                <br />
                the details.
              </h2>
              <p className="mt-4 text-[0.85rem] leading-relaxed text-white/80 max-w-sm">
                Every stitch tells a story of artisanal craft, premium fabrics, and contemporary
                design.
              </p>
              <a
                href="/about"
                className="mt-6 inline-flex items-center bg-white text-foreground px-7 py-3 text-[0.72rem] font-semibold uppercase tracking-wide hover:bg-accent hover:text-white transition-colors duration-200"
              >
                Our Story
              </a>
            </Reveal>
          </Shell>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-8 md:py-12 bg-muted/30">
        <Shell>
          <Reveal>
            <div className="text-center mb-6">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-accent">
                Reviews
              </span>
              <h2 className="font-serif text-[1.8rem] md:text-[2.4rem] font-normal mt-1 text-foreground">
                What Our Customers Say
              </h2>
            </div>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div className="bg-white p-6 border border-border">
                  <StarRow count={t.rating} />
                  <p className="mt-3 text-[0.85rem] leading-relaxed text-foreground/80">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-[0.75rem] font-semibold text-foreground">{t.name}</p>
                    <p className="text-[0.65rem] text-muted-foreground">
                      Verified Buyer — {t.product}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Shell>
      </section>

      <FAQSection />
    </>
  );
}
