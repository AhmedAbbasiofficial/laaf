import { shopifyFetch } from "./client";
import type {
  CartCreateResponse,
  CartLinesAddResponse,
  CartLinesRemoveResponse,
  CartLinesUpdateResponse,
} from "./types";

// ── Shopify Cart types ──────────────────────────────────────────

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  lines: CartLine[];
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
      images: { edges: { node: { url: string; altText: string | null } }[] };
    };
    price: { amount: string; currencyCode: string };
    compareAtPrice: { amount: string; currencyCode: string } | null;
    selectedOptions: { name: string; value: string }[];
  };
};

// ── GraphQL queries ──────────────────────────────────────────────

const CART_CREATE_MUTATION = `#graphql
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product { title handle images(first: 1) { edges { node { url altText } } } }
                  price { amount currencyCode }
                  selectedOptions { name value }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount { amount currencyCode }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `#graphql
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product { title handle images(first: 1) { edges { node { url altText } } } }
                  price { amount currencyCode }
                  selectedOptions { name value }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount { amount currencyCode }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `#graphql
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  product { title handle images(first: 1) { edges { node { url altText } } } }
                }
              }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `#graphql
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  product { title handle images(first: 1) { edges { node { url altText } } } }
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_BY_ID_QUERY = `#graphql
  query CartById($id: ID!) {
    cart(id: $id) {
      id
      checkoutUrl
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product { title handle images(first: 1) { edges { node { url altText } } } }
                price { amount currencyCode }
                selectedOptions { name value }
              }
            }
          }
        }
      }
      cost {
        subtotalAmount { amount currencyCode }
        totalAmount { amount currencyCode }
      }
    }
  }
`;

// ── Cart API functions ──────────────────────────────────────────

const CART_KEY = "shopify_cart_id";

function getSavedCartId(): string | null {
  try {
    return localStorage.getItem(CART_KEY);
  } catch {
    return null;
  }
}

function saveCartId(id: string): void {
  try {
    localStorage.setItem(CART_KEY, id);
  } catch {}
}

function clearCartId(): void {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {}
}

export async function createCart(
  variantId: string,
  quantity: number = 1,
  attributes?: { key: string; value: string }[],
): Promise<ShopifyCart> {
  const lines = [{ merchandiseId: variantId, quantity }];
  if (attributes) {
    (lines[0] as any).attributes = attributes;
  }

  const data = await shopifyFetch<CartCreateResponse>(CART_CREATE_MUTATION, {
    input: { lines },
  });

  if (data.cartCreate.userErrors.length > 0) {
    throw new Error(data.cartCreate.userErrors.map((e) => e.message).join("; "));
  }

  const cart = data.cartCreate.cart;
  saveCartId(cart.id);
  return cart as unknown as ShopifyCart;
}

export async function getCart(): Promise<ShopifyCart | null> {
  const cartId = getSavedCartId();
  if (!cartId) return null;

  try {
    const data = await shopifyFetch<{ cart: any }>(CART_BY_ID_QUERY, { id: cartId });
    if (!data.cart) {
      clearCartId();
      return null;
    }
    return data.cart as ShopifyCart;
  } catch {
    clearCartId();
    return null;
  }
}

export async function addToCart(
  variantId: string,
  quantity: number = 1,
  attributes?: { key: string; value: string }[],
): Promise<ShopifyCart> {
  const existingCartId = getSavedCartId();

  if (!existingCartId) {
    return createCart(variantId, quantity, attributes);
  }

  const lines = [{ merchandiseId: variantId, quantity }];
  if (attributes) {
    (lines[0] as any).attributes = attributes;
  }

  const data = await shopifyFetch<CartLinesAddResponse>(CART_LINES_ADD_MUTATION, {
    cartId: existingCartId,
    lines,
  });

  if (data.cartLinesAdd.userErrors.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors.map((e) => e.message).join("; "));
  }

  return data.cartLinesAdd.cart as unknown as ShopifyCart;
}

export async function updateCartItem(
  lineId: string,
  quantity: number,
): Promise<ShopifyCart> {
  const cartId = getSavedCartId();
  if (!cartId) throw new Error("No cart found");

  const data = await shopifyFetch<CartLinesUpdateResponse>(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  if (data.cartLinesUpdate.userErrors.length > 0) {
    throw new Error(data.cartLinesUpdate.userErrors.map((e) => e.message).join("; "));
  }

  return data.cartLinesUpdate.cart as unknown as ShopifyCart;
}

export async function removeFromCart(lineIds: string | string[]): Promise<ShopifyCart> {
  const cartId = getSavedCartId();
  if (!cartId) throw new Error("No cart found");

  const ids = Array.isArray(lineIds) ? lineIds : [lineIds];

  const data = await shopifyFetch<CartLinesRemoveResponse>(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: ids,
  });

  if (data.cartLinesRemove.userErrors.length > 0) {
    throw new Error(data.cartLinesRemove.userErrors.map((e) => e.message).join("; "));
  }

  return data.cartLinesRemove.cart as unknown as ShopifyCart;
}

export async function clearCart(): Promise<void> {
  const cartId = getSavedCartId();
  if (!cartId) return;

  try {
    const cart = await getCart();
    if (cart && cart.lines.length > 0) {
      const allLineIds = cart.lines.map((l) => l.id);
      await removeFromCart(allLineIds);
    }
  } catch {
    clearCartId();
  }
}

// ── Variant lookup helpers ─────────────────────────────────────

export function findVariantByLength(
  variants: { id: string; title: string; selectedOptions: { name: string; value: string }[] }[],
  length: string,
): string | undefined {
  // Look for variant where a selected option matches the length value
  const match = variants.find((v) =>
    v.selectedOptions.some(
      (opt) => opt.name.toLowerCase().includes("length") && opt.value === `${length}"`,
    ) ||
    v.selectedOptions.some((opt) => opt.value === length) ||
    v.title.toLowerCase().includes(`${length}"`) ||
    v.title.includes(length),
  );
  return match?.id;
}

export function findDefaultVariant(
  variants: { id: string; title: string; availableForSale: boolean }[],
): string | undefined {
  // Prefer "Default" or "One Size", then first available
  const defaultVariant = variants.find(
    (v) => v.title === "Default Title" || v.title === "One Size" || v.title === "Default",
  );
  if (defaultVariant) return defaultVariant.id;
  const available = variants.find((v) => v.availableForSale);
  return available?.id;
}
