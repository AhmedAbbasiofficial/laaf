// ── Raw Shopify Storefront types ──────────────────────────────────

export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyPriceRange = {
  minVariantPrice: ShopifyMoney;
  maxVariantPrice: ShopifyMoney;
};

export type ShopifyProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: { name: string; value: string }[];
  image: ShopifyImage | null;
};

export type ShopifyCollection = {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: ShopifyImage | null;
  products: {
    edges: { node: ShopifyProduct }[];
  };
};

export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  availableForSale: boolean;
  priceRange: ShopifyPriceRange;
  images: {
    edges: { node: ShopifyImage }[];
  };
  variants: {
    edges: { node: ShopifyProductVariant }[];
  };
  collections?: {
    edges: { node: { handle: string; title: string } }[];
  };
};

// ── GraphQL response shapes ──────────────────────────────────────

export type ProductsQueryResponse = {
  products: {
    edges: { node: ShopifyProduct }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

export type ProductByHandleResponse = {
  productByHandle: ShopifyProduct | null;
};

export type CollectionByHandleResponse = {
  collectionByHandle: ShopifyCollection | null;
};

export type CartCreateResponse = {
  cartCreate: {
    cart: {
      id: string;
      checkoutUrl: string;
      lines: {
        edges: { node: { id: string; quantity: number; merchandise: { id: string } } }[];
      };
      cost: {
        subtotalAmount: ShopifyMoney;
        totalAmount: ShopifyMoney;
      };
    };
    userErrors: { field: string; message: string }[];
  };
};

export type CartLinesAddResponse = {
  cartLinesAdd: {
    cart: {
      id: string;
      checkoutUrl: string;
      lines: {
        edges: { node: { id: string; quantity: number; merchandise: { id: string } } }[];
      };
      cost: {
        subtotalAmount: ShopifyMoney;
        totalAmount: ShopifyMoney;
      };
    };
    userErrors: { field: string; message: string }[];
  };
};

export type CartLinesRemoveResponse = {
  cartLinesRemove: {
    cart: {
      id: string;
      checkoutUrl: string;
      lines: {
        edges: { node: { id: string; quantity: number; merchandise: { id: string } } }[];
      };
    };
    userErrors: { field: string; message: string }[];
  };
};

export type CartLinesUpdateResponse = {
  cartLinesUpdate: {
    cart: {
      id: string;
      checkoutUrl: string;
      lines: {
        edges: { node: { id: string; quantity: number; merchandise: { id: string } } }[];
      };
    };
    userErrors: { field: string; message: string }[];
  };
};
