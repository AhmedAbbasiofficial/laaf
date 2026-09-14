import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getActiveProducts, onShopifyDataReady, isShopifyLoading, type Product } from "@/lib/products";
import { Reveal } from "./Reveal";
import { Shell } from "./Section";
import { useState, useEffect } from "react";

function EditorialCard({ product }: { product: Product }) {
  const primaryImage = product.images[0];
  if (!primaryImage) return null;

  return (
    <Reveal className="group">
      <Link
        to="/collection/$slug"
        params={{ slug: product.slug }}
        className="block relative aspect-[4/5] overflow-hidden bg-secondary"
      >
        <img
          src={primaryImage.src}
          alt={primaryImage.alt}
          width={primaryImage.width}
          height={primaryImage.height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 40%, transparent 60%)",
          }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-end p-6 pb-8 sm:p-8 sm:pb-10 md:p-10 md:pb-12 text-center">
          <h3 className="font-serif text-[0.85rem] sm:text-[1.1rem] md:text-[1.4rem] text-white leading-tight tracking-wide">
            {product.name}
          </h3>
          <span className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 text-[0.6rem] sm:text-[0.68rem] md:text-[0.72rem] font-semibold uppercase tracking-[0.15em] text-white transition-colors">
            Shop Now
            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

export function FeaturedProducts() {
  const [featuredPair, setFeaturedPair] = useState(() => getActiveProducts().slice(0, 2));
  const loading = isShopifyLoading();

  useEffect(() => {
    return onShopifyDataReady(() => {
      setFeaturedPair(getActiveProducts().slice(0, 2));
    });
  }, []);

  if (loading || featuredPair.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-white">
      <Shell>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {featuredPair.map((product) => (
            <EditorialCard key={product.slug} product={product} />
          ))}
        </div>
      </Shell>
    </section>
  );
}
