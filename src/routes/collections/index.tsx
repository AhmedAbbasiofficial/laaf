import { createFileRoute, Link } from "@tanstack/react-router";
import { getActiveCollections, onShopifyDataReady, isShopifyLoading } from "@/lib/products";
import { Shell } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export const Route = createFileRoute('/collections/')({
  head: () => ({
    meta: [
      { title: "Collections — LAAF" },
      { name: "description", content: "Explore the premium modest fashion collections by LAAF." },
    ],
  }),
  component: CollectionsLanding,
});

function CollectionsLanding() {
  const [, setTick] = useState(0);
  const loading = isShopifyLoading();
  useEffect(() => onShopifyDataReady(() => setTick((t) => t + 1)), []);
  const collections = getActiveCollections().filter((c) => c.slug !== "frontpage");

  return (
    <div className="bg-white">
      {/* Page Header */}
      <div className="pt-16 pb-12 text-center">
        <Shell>
          <Reveal>
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent">Discover</span>
            <h1 className="font-serif text-[2.5rem] md:text-[3.5rem] font-normal mt-2 text-foreground">Collections</h1>
          </Reveal>
        </Shell>
      </div>

      {/* Collections Editorial Layout */}
      <div className="flex flex-col gap-16 md:gap-32 pb-24">
        {collections.map((col, i) => {
          const isEven = i % 2 === 0;
          const isFullWidth = i === 2; // Make the 3rd one full width for variety

          if (isFullWidth) {
            return (
              <Reveal key={col.slug} className="relative h-[600px] md:h-[800px] w-full overflow-hidden bg-secondary">
                {col.heroImage ? (
                  <img
                    src={col.heroImage}
                    alt={col.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <div className="max-w-lg">
                    <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] text-white tracking-wide">{col.title}</h2>
                    <p className="mt-4 text-white/80 text-[0.95rem] md:text-base mb-8">{col.description}</p>
                    <Link
                      to={`/collections/${col.slug}`}
                      className="inline-flex items-center bg-white text-foreground px-8 py-3 text-[0.75rem] font-semibold uppercase tracking-wider hover:bg-accent hover:text-white transition-colors duration-200"
                    >
                      Explore <span className="ml-2">→</span>
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          }

          return (
            <Shell key={col.slug}>
              <Reveal className={cn("flex flex-col gap-8 md:gap-16 items-center", isEven ? "md:flex-row" : "md:flex-row-reverse")}>
                <div className="flex-1 w-full">
                  <div className="aspect-[4/5] md:aspect-[3/4] w-full overflow-hidden bg-secondary">
                    {col.heroImage ? (
                      <img
                        src={col.heroImage}
                        alt={col.title}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                </div>
                <div className={cn("flex-1 w-full flex flex-col justify-center", isEven ? "md:pl-8 lg:pl-16" : "md:pr-8 lg:pr-16 text-right md:items-end")}>
                  <h2 className="font-serif text-[2rem] md:text-[2.8rem] text-foreground tracking-wide">{col.title}</h2>
                  <p className="mt-4 text-muted-foreground text-[0.95rem] md:text-base max-w-md">{col.description}</p>
                  <Link
                    to={`/collections/${col.slug}`}
                    className="mt-8 inline-flex items-center text-[0.72rem] font-bold uppercase tracking-wider text-foreground border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors duration-200"
                  >
                    Explore Collection <span className="ml-2">→</span>
                  </Link>
                </div>
              </Reveal>
            </Shell>
          );
        })}
      </div>
    </div>
  );
}
