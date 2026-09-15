import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { searchProducts, formatPrice } from "@/lib/products";
import laafLogo from "@/assets/laaf-logo.png";

const nav: { label: string; href: string; accent?: boolean }[] = [
  { label: "NEW IN", href: "/collections/new-in" },
  { label: "EVERYDAY WEAR", href: "/collections/everyday-wear" },
  { label: "EVERYDAY ESSENTIALS", href: "/collections/everyday-essentials" },
  { label: "HIJAB ACCESSORIES", href: "/collections/hijab-accessories" },
  { label: "MODEST CO-ORD", href: "/collections/modest-co-ord" },
];

const mobileCollectionLinks = nav.map((item) => ({
  label: item.label,
  to: item.href,
}));

const mobileCompanyLinks = [
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
  { label: "Our Craftsmanship", to: "/signature-details" },
];

const SUGGESTION_LIMIT = 6;

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchProducts(query).slice(0, SUGGESTION_LIMIT);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIdx(-1);
  }, [query]);

  const closeAndGo = useCallback(
    (path: string) => {
      onClose();
      navigate({ to: path });
    },
    [onClose, navigate],
  );

  const handleSubmit = useCallback(() => {
    const val = query.trim();
    if (val) {
      closeAndGo(`/search?q=${encodeURIComponent(val)}`);
    }
  }, [query, closeAndGo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((prev) => Math.min(prev + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((prev) => Math.max(prev - 1, -1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (activeIdx >= 0 && results[activeIdx]) {
          closeAndGo(`/collection/${results[activeIdx].slug}`);
        } else {
          handleSubmit();
        }
      }
    },
    [activeIdx, results, onClose, closeAndGo, handleSubmit],
  );

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Search products"
    >
      <div
        className="absolute top-0 left-0 right-0 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-4 px-5 py-4 md:px-10">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search LAAF products..."
            className="flex-1 bg-transparent py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-suggestions"
            aria-activedescendant={activeIdx >= 0 ? `search-item-${activeIdx}` : undefined}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close search"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Suggestions */}
        {query.trim() && (
          <div
            ref={listRef}
            id="search-suggestions"
            role="listbox"
            className="border-t border-border max-h-[60vh] overflow-y-auto"
          >
            {results.length > 0 ? (
              <>
                {results.map((product, i) => {
                  const img = product.images[0];
                  return (
                    <a
                      key={product.slug}
                      id={`search-item-${i}`}
                      role="option"
                      aria-selected={i === activeIdx}
                      href={`/collection/${product.slug}`}
                      onClick={(e) => { e.preventDefault(); closeAndGo(`/collection/${product.slug}`); }}
                      className={cn(
                        "flex items-center gap-4 px-5 py-3 md:px-10 transition-colors",
                        i === activeIdx ? "bg-muted" : "hover:bg-muted/50",
                      )}
                    >
                      {img && (
                        <img
                          src={img.src}
                          alt={img.alt}
                          width={48}
                          height={64}
                          className="h-12 w-9 shrink-0 object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.82rem] font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-[0.72rem] text-muted-foreground">{formatPrice(product)}</p>
                      </div>
                    </a>
                  );
                })}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full border-t border-border px-5 py-3 md:px-10 text-left text-[0.78rem] font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  View all results for &ldquo;{query.trim()}&rdquo; →
                </button>
              </>
            ) : (
              <div className="px-5 py-8 md:px-10 text-center">
                <p className="text-[0.85rem] font-medium text-foreground">No products found</p>
                <p className="mt-1 text-[0.78rem] text-muted-foreground">Try another search term or explore our latest collection.</p>
                <a
                  href="/collections/new-in"
                  onClick={(e) => { e.preventDefault(); closeAndGo("/collections/new-in"); }}
                  className="mt-4 inline-flex items-center border border-foreground px-5 py-2 text-[0.7rem] font-semibold uppercase tracking-wide hover:bg-foreground hover:text-white transition-colors"
                >
                  Shop New In
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Header() {
  const { bagCount, setBagOpen, hydrated, wishlistCount } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, searchOpen]);

  return (
    <>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="mx-auto grid h-[64px] md:h-[72px] max-w-[1440px] items-center grid-cols-[1fr_auto_1fr] px-4 md:px-8 lg:px-12">
          {/* Left: hamburger (mobile) + desktop nav */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              className="grid h-10 w-10 shrink-0 place-items-center lg:hidden hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <nav aria-label="Primary" className="hidden items-center gap-3 xl:gap-5 lg:flex min-w-0 overflow-hidden">
              {nav.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "nav-link text-[0.72rem] xl:text-[0.78rem] font-medium tracking-wide transition-colors duration-200 whitespace-nowrap shrink-0",
                    item.accent
                      ? "text-sale font-semibold"
                      : "text-foreground hover:text-accent",
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <Link to="/" className="shrink-0 px-2 xl:px-4 flex items-center justify-center" aria-label="LAAF — home">
            <div className="overflow-hidden h-[60px] md:h-[60px] lg:h-[64px] w-[75px] md:w-[80px] lg:w-[90px] flex items-center justify-center">
              <img
                src={laafLogo}
                alt="LAAF"
                className="h-[200px] md:h-[210px] lg:h-[230px] w-auto max-w-none mt-[-10px] md:mt-[-10px] lg:mt-[-12px]"
              />
            </div>
          </Link>

          {/* Right: icons */}
          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid h-10 w-10 place-items-center hover:bg-muted transition-colors"
              aria-label="Search"
            >
              <Search className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.5} />
            </button>
            <a
              href="/wishlist"
              className="relative grid h-10 w-10 place-items-center hover:bg-muted transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.5} />
              {hydrated && wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-0.5 text-[0.55rem] font-semibold text-white">
                  {wishlistCount}
                </span>
              )}
            </a>
            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className="relative grid h-10 w-10 place-items-center hover:bg-muted transition-colors"
              aria-label={`Shopping bag${hydrated && bagCount ? `, ${bagCount} items` : ""}`}
            >
              <ShoppingBag className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.5} />
              {hydrated && bagCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-0.5 text-[0.55rem] font-semibold text-white">
                  {bagCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden",
            mobileOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!mobileOpen}
        >
          <div
            className={cn(
              "absolute inset-0 bg-black/40 transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex w-[82%] max-w-[340px] flex-col overflow-y-auto bg-white px-6 py-8 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-5 top-5 grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <nav aria-label="Mobile" className="mt-14 flex flex-col gap-0">
              {mobileCollectionLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-[0.88rem] font-medium text-foreground transition-colors hover:text-accent border-b border-border last:border-b-0"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}