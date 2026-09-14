/**
 * HeroSlider — LAAF.pk Immersive Campaign Hero
 *
 * Architecture:
 * - ALL slide images live in the DOM simultaneously, stacked via absolute positioning.
 *   Only the active one has opacity:1 — the rest are opacity:0.
 *   The CSS transition on opacity creates a true crossfade, eliminating any flash.
 * - Text and CTA are rendered from a SINGLE activeSlide source of truth.
 *   There is exactly one CTA in the DOM at any time, belonging to the active campaign.
 * - A separate "display" index drives the text/CTA. It updates AFTER the image
 *   crossfade begins, synchronized so old text exits as the new image fades in.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

import heroAbaya   from "@/assets/hero-abaya.jpg";
import bannerPicnic from "@/assets/banner-picnic.jpg";
import bannerField  from "@/assets/banner-field.jpg";

// ─── Campaign Data ────────────────────────────────────────────────────────────
type Campaign = {
  id: string;
  image: string;
  mobileImage: string;
  objectPosition: string;       // focal point for object-position CSS
  eyebrow: string;
  title: string;
  description?: string;
  ctaLabel: string;
  ctaUrl: string;
};

const CAMPAIGNS: Campaign[] = [
  {
    id: "c1",
    image: bannerField,
    mobileImage: bannerField,
    objectPosition: "center center",
    eyebrow: "New Edit",
    title: "Modern Modesty",
    description: "The new season.",
    ctaLabel: "Shop now",
    ctaUrl: "/collection?fresh=1",
  },
  {
    id: "c2",
    image: bannerPicnic,
    mobileImage: bannerPicnic,
    objectPosition: "center center",
    eyebrow: "Everyday",
    title: "Everyday Ease",
    description: "LAAF essentials.",
    ctaLabel: "Shop now",
    ctaUrl: "/collections/everyday-wear",
  },
];

const AUTOPLAY_MS   = 3000;   // display duration per campaign
const IMG_FADE_MS   = 500;    // image crossfade duration
const TEXT_OUT_MS   = 200;    // text exit duration
const TEXT_IN_MS    = 350;    // text enter duration
const TEXT_DELAY_MS = 150;    // delay before text enters after image starts fading in

// ─── Component ────────────────────────────────────────────────────────────────
export function HeroSlider() {
  // imageIndex  = which background image is "on top" (fully visible)
  // contentIndex = which campaign's copy/CTA is visible
  // These are intentionally split: text exits before imageIndex changes,
  // then text enters 250ms after the image starts fading in.
  const [imageIndex,   setImageIndex]   = useState(0);
  const [contentIndex, setContentIndex] = useState(0);
  const [textVisible,  setTextVisible]  = useState(true);  // drives text CSS class
  const [isLocked,     setIsLocked]     = useState(false); // prevent overlap
  const [isHovered,    setIsHovered]    = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const autoplayRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef     = useRef<number | null>(null);

  // ── Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // ── Core transition: oldIdx → newIdx
  const goTo = useCallback((newIdx: number) => {
    if (isLocked || newIdx === imageIndex) return;
    setIsLocked(true);

    if (reducedMotion) {
      // Skip animation entirely for accessibility
      setImageIndex(newIdx);
      setContentIndex(newIdx);
      setIsLocked(false);
      return;
    }

    // STEP 1 — text exits (300ms)
    setTextVisible(false);

    transitionRef.current = setTimeout(() => {
      // STEP 2 — image crossfade begins (800ms CSS transition).
      //           Content index switches now so the correct copy is
      //           ready once text re-enters.
      setImageIndex(newIdx);
      setContentIndex(newIdx);

      // STEP 3 — wait a beat, then bring text in (250ms after image starts)
      transitionRef.current = setTimeout(() => {
        setTextVisible(true);

        // STEP 4 — unlock after text animation finishes
        transitionRef.current = setTimeout(() => {
          setIsLocked(false);
        }, TEXT_IN_MS);
      }, TEXT_DELAY_MS);
    }, TEXT_OUT_MS);
  }, [imageIndex, isLocked, reducedMotion]);

  const next = useCallback(() =>
    goTo((imageIndex + 1) % CAMPAIGNS.length), [imageIndex, goTo]);
  const prev = useCallback(() =>
    goTo((imageIndex - 1 + CAMPAIGNS.length) % CAMPAIGNS.length), [imageIndex, goTo]);

  // ── Autoplay
  const scheduleAutoplay = useCallback(() => {
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
    autoplayRef.current = setTimeout(() => { next(); }, AUTOPLAY_MS);
  }, [next]);

  useEffect(() => {
    if (isHovered || isLocked) {
      if (autoplayRef.current) { clearTimeout(autoplayRef.current); autoplayRef.current = null; }
      return;
    }
    scheduleAutoplay();
    return () => { if (autoplayRef.current) clearTimeout(autoplayRef.current); };
  }, [imageIndex, isHovered, isLocked, scheduleAutoplay]);

  // ── Page-visibility pause
  useEffect(() => {
    const h = () => {
      if (document.hidden) {
        if (autoplayRef.current) { clearTimeout(autoplayRef.current); autoplayRef.current = null; }
      }
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, []);

  // ── Keyboard navigation
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  // ── Touch / swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const dx = touchStartXRef.current - (e.changedTouches[0]?.clientX ?? 0);
    if (Math.abs(dx) > 48) { dx > 0 ? next() : prev(); }
    touchStartXRef.current = null;
  };

  // ── Cleanup
  useEffect(() => () => {
    if (autoplayRef.current)   clearTimeout(autoplayRef.current);
    if (transitionRef.current) clearTimeout(transitionRef.current);
  }, []);

  const slide = CAMPAIGNS[contentIndex]!;

  return (
    <section
      aria-label="LAAF.pk Campaign Showcase"
      aria-roledescription="carousel"
      role="region"
      className="hero-slider relative w-full overflow-hidden bg-[#0a0a0a] select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ─────────────────────────────────────────────────────────────────────
          LAYER 1 — All campaign images, stacked.
          Crossfade = CSS opacity transition on all images simultaneously.
          The active image has opacity-[0.72]; all others are opacity-0.
          No src swapping. No flash. No gap.
      ───────────────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {CAMPAIGNS.map((c, i) => (
          <div
            key={c.id}
            className="absolute inset-0 transition-opacity ease-in-out"
            style={{ transitionDuration: `${IMG_FADE_MS}ms`, opacity: i === imageIndex ? 1 : 0 }}
          >
            {/* Ken-Burns pan: only the active image gets a slow scale */}
            <div
              className="absolute inset-0 transition-transform ease-linear"
              style={{
                transitionDuration: `${AUTOPLAY_MS + IMG_FADE_MS}ms`,
                transform: i === imageIndex ? "scale(1.05)" : "scale(1.0)",
              }}
            >
              <img
                src={c.image}
                alt=""           /* decorative — real alt is in the heading */
                loading={i === 0 ? "eager" : "lazy"}
                decoding={i === 0 ? "sync" : "async"}
                className="h-full w-full object-cover"
                style={{ objectPosition: c.objectPosition }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          LAYER 2 — Cinematic gradient overlay (darkens bottom for copy legibility)
      ───────────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ─────────────────────────────────────────────────────────────────────
          LAYER 3 — Single active campaign's copy + CTA.
          Driven entirely by contentIndex. One CTA in DOM. Always correct URL.
      ───────────────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end">
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-5 sm:pb-14 md:px-12 md:pb-24 lg:px-20 lg:pb-28">
          {/* Text group — fades & slides as one unit */}
          <div
            className="max-w-[12.5rem] sm:max-w-md md:max-w-xl lg:max-w-2xl xs:max-w-[13.5rem]"
            style={{
              transition: textVisible
                ? `opacity ${TEXT_IN_MS}ms ease, transform ${TEXT_IN_MS}ms ease`
                : `opacity ${TEXT_OUT_MS}ms ease, transform ${TEXT_OUT_MS}ms ease`,
              opacity: textVisible ? 1 : 0,
              transform: textVisible ? "translateY(0)" : "translateY(14px)",
            }}
          >
            {/* Eyebrow */}
            <p className="text-[0.52rem] font-semibold uppercase tracking-[0.15em] text-white/75 sm:text-[0.58rem] md:text-[0.64rem] md:tracking-[0.24em]">
              {slide.eyebrow}
            </p>

            {/* Headline */}
            <h2 className="mt-2 font-serif font-normal leading-[1.04] tracking-tight text-white"
                style={{ fontSize: "clamp(1.35rem, 4vw, 2.8rem)" }}>
              {slide.title}
            </h2>

            {/* Description */}
            {slide.description && (
              <p className="mt-2 max-w-[11rem] font-light leading-relaxed text-white/75 sm:max-w-sm md:max-w-md"
                 style={{ fontSize: "clamp(0.68rem, 1vw, 0.84rem)" }}>
                {slide.description}
              </p>
            )}

            {/* ── The ONE dynamic CTA — label and URL belong to active campaign ── */}
            <div className="mt-4 sm:mt-6">
              <Link
                to={slide.ctaUrl as any}
                className="group inline-flex items-center gap-2 px-4 py-2 text-[0.52rem] font-semibold uppercase tracking-[0.1em] text-white bg-transparent border border-white/30 hover:bg-white hover:text-black transition-all duration-400 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-2 sm:px-5 sm:py-2.5 sm:text-[0.68rem] sm:tracking-[0.12em]"
              >
                <span>{slide.ctaLabel}</span>
                <ArrowRight
                  className="h-3 w-3 transition-transform duration-400 group-hover:translate-x-1.5 sm:h-3.5 sm:w-3.5"
                  strokeWidth={2.5}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Arrows removed per user request */}

      {/* ─────────────────────────────────────────────────────────────────────
          LAYER 5 — Editorial progress indicators (bottom-center)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 sm:bottom-6 sm:gap-6">
        {CAMPAIGNS.map((c, i) => {
          const isActive = i === imageIndex;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to campaign ${i + 1}`}
              aria-current={isActive ? "true" : undefined}
              className="group flex flex-col items-center gap-1.5 focus-visible:outline-none"
            >
              {/* Number label */}
              <span
                className="text-[0.62rem] font-bold tabular-nums transition-colors duration-300"
                style={{ color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}
              >
                0{i + 1}
              </span>

              {/* Progress bar track */}
              <div className="h-[2px] w-12 overflow-hidden bg-white/15">
                {isActive ? (
                  <div
                    key={`bar-${imageIndex}`}
                    className="h-full w-full origin-left bg-accent"
                    style={{
                      animation: reducedMotion || isHovered
                        ? "none"
                        : `heroProgress ${AUTOPLAY_MS}ms linear forwards`,
                    }}
                  />
                ) : (
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: i < imageIndex ? "100%" : "0%",
                      background: "rgba(255,255,255,0.35)",
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Keyframe injection — scoped to avoid leaking into global CSS */}
      <style>{`
        @keyframes heroProgress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
}
