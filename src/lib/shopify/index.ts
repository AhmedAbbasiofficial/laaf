export { shopifyFetch, ShopifyError, DOMAIN, TOKEN, API_VERSION } from "./client";
export {
  fetchAllProducts,
  fetchProductByHandle,
  fetchCollections,
  fetchCollectionByHandle,
  shopifyProductToLocal,
  searchShopifyProducts,
} from "./products";
export {
  createCart,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  findVariantByLength,
  findDefaultVariant,
} from "./cart";
export {
  getCheckoutUrl,
  syncBagToShopifyCart,
  addVariantToShopifyCart,
  clearShopifyCart,
} from "./cart-bridge";
export type { ShopifyCart, CartLine } from "./cart";
export type {
  ShopifyProduct,
  ShopifyCollection,
  ShopifyImage,
  ShopifyMoney,
  ShopifyPriceRange,
  ShopifyProductVariant,
} from "./types";
