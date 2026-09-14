import { useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { getProduct } from "@/lib/products";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SHIPPING_CONFIG } from "@/lib/shipping";

export function BagDrawer() {
  const { bag, bagOpen, setBagOpen, setQty, removeFromBag } = useStore();

  useEffect(() => {
    if (!bagOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBagOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [bagOpen, setBagOpen]);

  const subtotal = bag.reduce((sum, item) => {
    const product = getProduct(item.slug);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);

  const handleCheckout = useCallback(async () => {
    try {
      const { syncBagToShopifyCart, getCheckoutUrl } = await import("@/lib/shopify/cart-bridge");
      await syncBagToShopifyCart(
        bag.map((item) => ({
          slug: item.slug,
          size: item.size,
          ...(item.length !== undefined ? { length: item.length } : {}),
          qty: item.qty,
        })),
      );
      const url = getCheckoutUrl();
      if (url) {
        window.location.href = url;
        return;
      }
    } catch {}
    window.location.href = "/cart";
  }, [bag]);

  return (
    <div
      className={cn("fixed inset-0 z-50", bagOpen ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!bagOpen}
      role="dialog"
      aria-label="Shopping cart"
    >
      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          bagOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={() => setBagOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          bagOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.1em]">
              Shopping Bag
              {bag.length > 0 && (
                <span className="ml-1.5 text-muted-foreground font-normal">
                  ({bag.reduce((n, i) => n + i.qty, 0)})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setBagOpen(false)}
            className="grid h-9 w-9 place-items-center hover:bg-muted transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {bag.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="grid h-16 w-16 place-items-center bg-muted">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.12em] font-semibold text-muted-foreground mb-1">
                Your Bag Is Empty
              </p>
              <p className="text-[0.8rem] text-muted-foreground">
                Add pieces to your bag from the collection.
              </p>
            </div>
            <a
              href="/collection"
              onClick={() => setBagOpen(false)}
              className="mt-1 inline-flex items-center justify-center bg-foreground text-white px-8 py-3 text-[0.7rem] font-semibold uppercase tracking-wide hover:bg-accent transition-colors"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {bag.map((item) => {
                const product = getProduct(item.slug);
                if (!product) return null;
                const image = product.images[0]!;
                return (
                  <li key={`${item.slug}-${item.size}-${item.length || ""}`} className="flex gap-4 py-4">
                    <Link
                      to="/collection/$slug"
                      params={{ slug: product.slug }}
                      onClick={() => setBagOpen(false)}
                      className="w-[72px] h-[96px] shrink-0 overflow-hidden bg-muted"
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        width={image.width}
                        height={image.height}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <Link
                          to="/collection/$slug"
                          params={{ slug: product.slug }}
                          onClick={() => setBagOpen(false)}
                          className="text-[0.78rem] font-medium leading-snug text-foreground hover:text-accent transition-colors line-clamp-2"
                        >
                          {product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromBag(item.slug, item.size, item.length)}
                          className="grid h-5 w-5 shrink-0 place-items-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`Remove ${product.name}`}
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {item.length ? `Length: ${item.length}"` : item.size} · {product.colour}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button
                            type="button"
                            className="grid h-7 w-7 place-items-center hover:bg-muted transition-colors"
                            onClick={() => setQty(item.slug, item.size, item.length, item.qty - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                          <span className="w-7 text-center text-[0.72rem] font-medium">{item.qty}</span>
                          <button
                            type="button"
                            className="grid h-7 w-7 place-items-center hover:bg-muted transition-colors"
                            onClick={() => setQty(item.slug, item.size, item.length, item.qty + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        </div>
                        <span className="text-[0.78rem] font-semibold text-foreground">
                          PKR {(product.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.75rem] text-muted-foreground">Subtotal</span>
                <span className="text-[0.85rem] font-semibold text-foreground">
                  PKR {subtotal.toLocaleString()}
                </span>
              </div>
              <p className="text-[0.62rem] text-muted-foreground mb-3">
                Shipping calculated at checkout.
              </p>
              <button
                type="button"
                onClick={() => { setBagOpen(false); handleCheckout(); }}
                className="block w-full bg-foreground py-3.5 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-white hover:bg-accent transition-colors"
              >
                Proceed to Checkout
              </button>
              <Link
                to="/cart"
                onClick={() => setBagOpen(false)}
                className="mt-2 block w-full border border-border py-2.5 text-center text-[0.65rem] font-medium uppercase tracking-wide text-foreground hover:bg-muted transition-colors"
              >
                View Full Cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
