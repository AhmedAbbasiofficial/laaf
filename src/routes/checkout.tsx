import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute('/checkout')({
  head: () => ({
    meta: [
      { title: "Checkout - LAAF" },
      { name: "description", content: "Redirect to Shopify checkout." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { bag } = useStore();

  useEffect(() => {
    let cancelled = false;

    (async () => {
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

        const shopifyUrl = getCheckoutUrl();
        if (!cancelled && shopifyUrl) {
          window.location.replace(shopifyUrl);
          return;
        }

        if (!cancelled) {
          window.location.replace("/cart");
        }
      } catch {
        if (!cancelled) {
          window.location.replace("/cart");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bag]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <p className="font-serif text-2xl">Redirecting to Shopify checkout...</p>
      </div>
    </div>
  );
}

export default Checkout;

