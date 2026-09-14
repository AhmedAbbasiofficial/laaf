import { Link } from "@tanstack/react-router";
import { Reveal } from "./Reveal";

export type EditorialBrandSectionProps = {
  eyebrow: string;
  heading: string;
  description: string;
  mainImage: { src: string; alt: string; width: number; height: number };
  secondaryImage: { src: string; alt: string; width: number; height: number };
  ctaLabel: string;
  ctaUrl: string;
};

export function EditorialBrandSection({
  eyebrow,
  heading,
  description,
  mainImage,
  secondaryImage,
  ctaLabel,
  ctaUrl,
}: EditorialBrandSectionProps) {
  return (
    <section className="bg-[#f6f6f6] py-8 md:py-14 lg:py-[60px]">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <Reveal>
          {/* ── Desktop: three-column row ── */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {/* Main Image */}
            <div className="w-[34%] shrink-0">
              <div className="overflow-hidden rounded-[13px]" style={{ aspectRatio: "3 / 5.5" }}>
                <img
                  src={mainImage.src}
                  alt={mainImage.alt}
                  width={mainImage.width}
                  height={mainImage.height}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Secondary Image */}
            <div className="w-[24%] shrink-0">
              <div className="overflow-hidden rounded-[13px]" style={{ aspectRatio: "3 / 3.2" }}>
                <img
                  src={secondaryImage.src}
                  alt={secondaryImage.alt}
                  width={secondaryImage.width}
                  height={secondaryImage.height}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Text Content */}
            <div className="w-[30%] flex flex-col items-center justify-center text-center px-6 lg:px-10">
              <span
                className="text-[0.74rem] font-normal italic text-foreground/70"
                style={{ fontFamily: "var(--font-heading, 'Tenor Sans', serif)" }}
              >
                {eyebrow}
              </span>
              <h2
                className="mt-2 text-[1.4rem] lg:text-[1.8rem] font-normal leading-[1.2] text-foreground"
                style={{ fontFamily: "var(--font-heading, 'Tenor Sans', serif)" }}
              >
                {heading}
              </h2>
              <p className="mt-3 text-[0.74rem] leading-[1.45] text-foreground/60">{description}</p>
              <Link
                to={ctaUrl as any}
                className="mt-4 text-[0.76rem] font-normal tracking-wide text-foreground hover:text-accent transition-colors"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>

          {/* ── Mobile: images side-by-side, text below ── */}
          <div className="flex md:hidden flex-col gap-6">
            {/* Two images in one row */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="overflow-hidden rounded-[13px]" style={{ aspectRatio: "3 / 6" }}>
                <img
                  src={mainImage.src}
                  alt={mainImage.alt}
                  width={mainImage.width}
                  height={mainImage.height}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-[13px]" style={{ aspectRatio: "3 / 2.8" }}>
                <img
                  src={secondaryImage.src}
                  alt={secondaryImage.alt}
                  width={secondaryImage.width}
                  height={secondaryImage.height}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Text below */}
            <div className="flex flex-col items-center text-center px-4">
              <span
                className="text-[0.72rem] font-normal italic text-foreground/70"
                style={{ fontFamily: "var(--font-heading, 'Tenor Sans', serif)" }}
              >
                {eyebrow}
              </span>
              <h2
                className="mt-2 text-[1.3rem] font-normal leading-[1.2] text-foreground"
                style={{ fontFamily: "var(--font-heading, 'Tenor Sans', serif)" }}
              >
                {heading}
              </h2>
              <p className="mt-3 text-[0.72rem] leading-[1.45] text-foreground/60">{description}</p>
              <Link
                to={ctaUrl as any}
                className="mt-4 text-[0.72rem] font-normal tracking-wide text-foreground hover:text-accent transition-colors"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
