import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState, useEffect } from "react";
import { Shell } from "@/components/site/Section";
import { useStore } from "@/lib/store";
import { getProduct, formatPrice, getActiveProducts, isShopifyLoading, onShopifyDataReady } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — LAAF" },
      { name: "description", content: "Your shopping bag — review items before checkout." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { bag, setQty, removeFromBag, hydrated } = useStore();
  const [shopifyReady, setShopifyReady] = useState(() => !isShopifyLoading() && getActiveProducts().length > 0);

  useEffect(() => {
    if (shopifyReady) return;
    return onShopifyDataReady(() => setShopifyReady(true));
  }, [shopifyReady]);

  const productsReady = shopifyReady;

  if (!hydrated || !productsReady) {
    return (
      <Shell className="py-20 md:py-28">
        <div className="text-center">
          <p className="font-serif text-2xl">Loading your bag…</p>
          <p className="pt-3 text-sm text-muted-foreground">
            Preparing your shopping bag.
          </p>
        </div>
      </Shell>
    );
  }

  const items = bag.map((i) => ({ ...i, product: getProduct(i.slug) }));

  const subtotal = items.reduce((sum, it) => {
    if (!it.product || it.product.price === null) return sum;
    return sum + it.product.price * it.qty;
  }, 0);

  const handleCheckout = useCallback(() => {
    window.location.href = "/checkout";
  }, []);

  if (items.length === 0) {
    return (
      <Shell className="py-20 md:py-28">
        <div className="text-center">
          <p className="font-serif text-2xl">Your bag is empty</p>
          <p className="pt-3 text-sm text-muted-foreground">
            Add pieces to your bag from the collection.
          </p>
          <div className="mt-6">
            <a href="/collection" className="eyebrow inline-block border-b border-foreground pb-1">
              Browse the collection
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell className="py-20 md:py-28">
      <h1 className="font-serif text-2xl">Shopping bag</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {items.map((it) => (
            <div
              key={`${it.slug}-${it.size}-${it.length || ""}`}
              className="flex items-start gap-4 border-b border-border pb-4"
            >
              {it.product && it.product.images && it.product.images[0] ? (
                <img
                  src={it.product.images[0].src}
                  alt={it.product.images[0].alt}
                  width={120}
                  height={160}
                  className="h-28 w-20 object-cover rounded-sm"
                />
              ) : (
                <div className="h-28 w-20 rounded-sm bg-secondary/30" />
              )}
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-sm font-medium">{it.product?.name || it.slug}</h2>
                  <div className="text-sm">{it.product ? formatPrice(it.product) : ""}</div>
                </div>
                <div className="pt-2 text-sm text-muted-foreground">
                  {it.length ? `Length: ${it.length}"` : it.size}
                </div>
                <div className="pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(it.slug, it.size, it.length, Math.max(0, it.qty - 1))}
                    className="grid h-8 w-8 place-items-center border border-border"
                  >
                    −
                  </button>
                  <div className="px-3">{it.qty}</div>
                  <button
                    type="button"
                    onClick={() => setQty(it.slug, it.size, it.length, it.qty + 1)}
                    className="grid h-8 w-8 place-items-center border border-border"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromBag(it.slug, it.size, it.length)}
                    className="ml-4 text-sm text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-4">
          <div className="rounded-sm border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Subtotal</span>
              <strong>
                {subtotal > 0 ? `PKR ${subtotal.toLocaleString()}` : "Price on request"}
              </strong>
            </div>
            <p className="pt-2 text-xs text-muted-foreground">
              Taxes and shipping are calculated at checkout. Standard courier shipping rates apply.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCheckout}
              className="inline-flex w-full items-center justify-center bg-ink px-4 py-3 text-ink-foreground"
            >
              Checkout
            </button>
            <a
              href="/collection"
              className="inline-flex w-full items-center justify-center border border-border px-4 py-3"
            >
              Continue shopping
            </a>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

export default Cart;
