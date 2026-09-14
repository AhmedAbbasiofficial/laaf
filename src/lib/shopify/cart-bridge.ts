/**
 * Shopify Cart Bridge
 *
 * Keeps the local localStorage bag for instant UI, but also maintains
 * a parallel Shopify cart. When the user proceeds to checkout, we redirect
 * to Shopify's hosted checkout with the correct items.
 */
import {
  createCart as shopifyCreateCart,
  addToCart as shopifyAddToCart,
  updateCartItem as shopifyUpdateItem,
  removeFromCart as shopifyRemoveFromCart,
  getCart as shopifyGetCart,
  clearCart as shopifyClearCart,
} from "./cart";
import type { ShopifyCart } from "./cart";
import { getProduct, type Product } from "@/lib/products";

const CART_KEY = "shopify_cart_id";

let activeCart: ShopifyCart | null = null;

function saveCart(cart: ShopifyCart): void {
  activeCart = cart;
  try {
    localStorage.setItem(CART_KEY, cart.id);
  } catch {}
}

function clearSavedCart(): void {
  activeCart = null;
  try {
    localStorage.removeItem(CART_KEY);
  } catch {}
}

export function getCheckoutUrl(): string | null {
  if (activeCart?.checkoutUrl) return activeCart.checkoutUrl;
  return null;
}

async function getActiveCart(): Promise<ShopifyCart | null> {
  if (activeCart) return activeCart;
  const savedCart = await shopifyGetCart();
  if (savedCart) saveCart(savedCart);
  return savedCart;
}

/**
 * Resolve a Shopify variant ID from a product slug + length/size.
 * Only returns a variant when Shopify says the variant is available for sale.
 */
export function resolveVariantId(
  product: Product,
  length?: string,
  size?: string,
): string | null {
  if (product.shopifyVariants && product.shopifyVariants.length > 0) {
    if (length) {
      const match = product.shopifyVariants.find((v) =>
        v.availableForSale &&
        (
          v.selectedOptions.some(
            (opt) =>
              opt.name.toLowerCase().includes("length") &&
              (opt.value === `${length}"` || opt.value === length),
          ) ||
          v.title.includes(`${length}"`) ||
          v.title.includes(length)
        ),
      );
      if (match) return match.id;

      // If the requested length is present in the product feed
      // but every mapped variant at that length is disabled,
      // block the checkout handoff rather than picking another disabled ID.
      return null;
    }

    const available = product.shopifyVariants.find((v) => v.availableForSale);
    if (available) return available.id;

    // Important: never fall through to an unavailable shopifyVariants[0]
    // when the product catalog already says every variant is unavailable.
    return null;
  }

  // Only fallback to a single product-level variant id when the product
  // model itself is being used without the richer shopifyVariants list.
  if (product.shopifyVariantId) return product.shopifyVariantId;

  return null;
}

/**
 * Sync the local bag to Shopify cart.
 * Creates a new cart if none exists, or clears and rebuilds if bag changed.
 */
export async function syncBagToShopifyCart(
  bag: { slug: string; size: string; length?: string; qty: number }[],
): Promise<void> {
  try {
    const variantLines: { variantId: string; quantity: number }[] = [];

    for (const item of bag) {
      const product = getProduct(item.slug);
      if (!product) continue;

      const variantId = resolveVariantId(product, item.length, item.size);
      if (variantId) {
        variantLines.push({ variantId, quantity: item.qty });
      }
    }

    const existingCart = await getActiveCart();
    if (existingCart?.lines.length) {
      try {
        await shopifyRemoveFromCart(existingCart.lines.map((line) => line.id));
      } catch {
        clearSavedCart();
      }
    }

    if (variantLines.length === 0) {
      clearSavedCart();
      return;
    }

    let cart: ShopifyCart | null = null;
    for (const { variantId, quantity } of variantLines) {
      cart = cart
        ? await shopifyAddToCart(variantId, quantity)
        : await shopifyCreateCart(variantId, quantity);
      saveCart(cart);
    }
  } catch (err) {
    console.warn("Failed to sync bag to Shopify cart:", err);
  }
}

/**
 * Add a single item to Shopify cart.
 */
export async function addVariantToShopifyCart(
  slug: string,
  size: string,
  length?: string,
  qty: number = 1,
): Promise<void> {
  try {
    const product = getProduct(slug);
    if (!product) return;

    const variantId = resolveVariantId(product, length, size);
    if (!variantId) return;

    const existingCart = await getActiveCart();
    let cart = existingCart;
    if (!cart) {
      cart = await shopifyCreateCart(variantId, qty);
    } else {
      cart = await shopifyAddToCart(variantId, qty);
    }

    if (cart) {
      saveCart(cart);
    }
  } catch (err) {
    console.warn("Failed to add variant to Shopify cart:", err);
  }
}

/**
 * Clear the Shopify cart.
 */
export async function clearShopifyCart(): Promise<void> {
  try {
    await shopifyClearCart();
  } catch {}
  clearSavedCart();
}
