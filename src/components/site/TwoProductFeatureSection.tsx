import { Link } from "@tanstack/react-router";
import {
  getActiveProducts,
  onShopifyDataReady,
  isShopifyLoading,
  type Product,
} from "@/lib/products";
import { Reveal } from "./Reveal";
import { useState, useEffect } from "react";

function ProductTile({ product, label }: { product: Product; label: string }) {
  const image = product.images[0];
  if (!image) return null;

  return (
    <Reveal className="group">
      <Link
        to="/collection/$slug"
        params={{ slug: product.slug }}
        className="block relative aspect-[4/5] overflow-hidden bg-secondary"
        aria-label={`Shop ${label}`}
      >
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 flex flex-col justify-end p-5 pb-6 sm:p-7 sm:pb-8 md:p-8 md:pb-10">
          <h3 className="text-[0.7rem] sm:text-[0.8rem] md:text-[0.95rem] font-semibold uppercase tracking-[0.2em] text-white">
            {label}
          </h3>
          <span className="mt-1.5 sm:mt-2 text-[0.55rem] sm:text-[0.6rem] md:text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white border-b border-white/60 pb-0.5 inline-block w-fit transition-colors group-hover:border-white">
            Shop Now
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

export function TwoProductFeatureSection() {
  const getPair = () => getActiveProducts().slice(0, 2);
  const [featurePair, setFeaturePair] = useState(() => getPair());
  const loading = isShopifyLoading();

  useEffect(() => {
    return onShopifyDataReady(() => setFeaturePair(getPair()));
  }, []);

  if (loading || featurePair.length === 0) return null;

  return (
    <section className="bg-white">
      <div className="grid grid-cols-2 gap-[2px]">
        {featurePair.map((product, i) => (
          <ProductTile
            key={product.slug}
            product={product}
            label={i === 0 ? "Premium Abaya" : "Bronze Botanical"}
          />
        ))}
      </div>
    </section>
  );
}
