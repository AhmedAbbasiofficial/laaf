import { shopifyFetch } from "./client";
import type {
  ProductsQueryResponse,
  ProductByHandleResponse,
  CollectionByHandleResponse,
  ShopifyProduct,
  ShopifyImage,
} from "./types";
import type { Product, CollectionSlug, Category } from "@/lib/products";

// ── GraphQL queries ──────────────────────────────────────────────

const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          handle
          description
          descriptionHtml
          productType
          tags
          createdAt
          updatedAt
          availableForSale
          priceRange {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                availableForSale
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                selectedOptions { name value }
                image { url altText width height }
              }
            }
          }
          collections(first: 10) {
            edges {
              node {
                handle
                title
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      productType
      tags
      createdAt
      updatedAt
      availableForSale
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            selectedOptions { name value }
            image { url altText width height }
          }
        }
      }
      collections(first: 10) {
        edges {
          node {
            handle
            title
          }
        }
      }
    }
  }
`;

const COLLECTION_BY_HANDLE_QUERY = `#graphql
  query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
      handle
      description
      image { url altText width height }
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            description
            descriptionHtml
            productType
            tags
            createdAt
            updatedAt
            availableForSale
            priceRange {
              minVariantPrice { amount currencyCode }
              maxVariantPrice { amount currencyCode }
            }
            images(first: 10) {
              edges {
                node {
                  url
                  altText
                  width
                  height
                }
              }
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price { amount currencyCode }
                  compareAtPrice { amount currencyCode }
                  selectedOptions { name value }
                  image { url altText width height }
                }
              }
            }
            collections(first: 10) {
              edges {
                node {
                  handle
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;

const COLLECTIONS_QUERY = `#graphql
  query Collections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          image { url altText width height }
        }
      }
    }
  }
`;

// ── Shopify → LAAF adapter ──────────────────────────────────────

function mapCategory(productType: string, tags: string[]): Category {
  const t = productType.toLowerCase();
  if (t.includes("hijab")) return "hijabs";
  return "abayas";
}

function mapCollections(collections: { handle: string }[]): CollectionSlug[] {
  const valid: CollectionSlug[] = [
    "new-in", "everyday-wear", "everyday-essentials",
    "hijab-accessories", "modest-co-ord",
  ];
  return collections
    .map((c) => c.handle as CollectionSlug)
    .filter((h) => valid.includes(h));
}

function isNewProduct(createdAt: string, tags: string[]): boolean {
  if (tags.some((t) => t.toLowerCase() === "new")) return true;
  const created = new Date(createdAt);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return created > thirtyDaysAgo;
}

function hasSalePrice(price: string, compareAt: string | null): boolean {
  if (!compareAt) return false;
  return parseFloat(price) < parseFloat(compareAt);
}

function mapImages(images: ShopifyImage[]): Product["images"] {
  return images.map((img) => ({
    src: img.url,
    alt: img.altText || "LAAF product image",
    width: img.width,
    height: img.height,
  }));
}

export function shopifyProductToLocal(sp: ShopifyProduct): Product {
  const images = mapImages(
    sp.images.edges.map((e) => e.node),
  );

  const variant = sp.variants.edges[0]?.node;
  const price = variant
    ? parseFloat(variant.price.amount)
    : parseFloat(sp.priceRange.minVariantPrice.amount);

  const compareAtVariant = variant?.compareAtPrice;
  const compareAtPrice = compareAtVariant
    ? parseFloat(compareAtVariant.amount) > 0
      ? parseFloat(compareAtVariant.amount)
      : undefined
    : undefined;

  const tags = sp.tags.map((t) => t.toLowerCase());
  const isNew = isNewProduct(sp.createdAt, tags);
  const isSale = hasSalePrice(
    variant?.price.amount || "0",
    compareAtVariant?.amount || null,
  );

  // Extract numeric Shopify product ID from GID (e.g. "gid://shopify/Product/123" → "123")
  const shopifyId = sp.id?.replace("gid://shopify/Product/", "") || undefined;

  const collections = sp.collections
    ? mapCollections(sp.collections.edges.map((e) => e.node))
    : [];

  // Extract colour from tags, variants, or title
  let colour = "Black";
  const colourTag = tags.find((t) =>
    ["black", "white", "navy", "beige", "brown", "grey", "gray", "green", "cream", "pink", "red", "blue"].some(
      (c) => t.includes(c),
    ),
  );
  if (colourTag) {
    colour = colourTag.charAt(0).toUpperCase() + colourTag.slice(1);
  }

  // Extract design details from description or tags
  const design = sp.description
    ? sp.description
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 5)
    : [sp.title];

  const result: Product = {
    slug: sp.handle,
    name: sp.title,
    price,
    currency: "PKR",
    colour,
    category: mapCategory(sp.productType, tags),
    collections,
    isNew,
    isSale,
    rating: 0,
    reviewCount: 0,
    summary: sp.description?.substring(0, 200) || sp.title,
    design,
    images,
    shopifyVariants: sp.variants.edges.map((e) => ({
      id: e.node.id,
      title: e.node.title,
      availableForSale: e.node.availableForSale,
      selectedOptions: e.node.selectedOptions,
    })),
    ...(shopifyId ? { shopifyId } : {}),
    ...(variant?.id ? { shopifyVariantId: variant.id } : {}),
    ...(compareAtPrice != null ? { compareAtPrice } : {}),
  };

  return result;
}

// ── API functions ───────────────────────────────────────────────

export async function fetchAllProducts(): Promise<Product[]> {
  const allProducts: Product[] = [];
  let hasNext = true;
  let cursor: string | null = null;

  while (hasNext) {
    const data: ProductsQueryResponse = await shopifyFetch<ProductsQueryResponse>(PRODUCTS_QUERY, {
      first: 50,
      after: cursor,
    });

    for (const edge of data.products.edges) {
      allProducts.push(shopifyProductToLocal(edge.node));
    }

    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return allProducts;
}

export async function fetchProductByHandle(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<ProductByHandleResponse>(PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });

  if (!data.productByHandle) return null;

  return shopifyProductToLocal(data.productByHandle);
}

export async function fetchCollections(): Promise<{ slug: string; title: string; description: string; heroImage: string }[]> {
  type CollectionsResponse = {
    collections: {
      edges: { node: { id: string; title: string; handle: string; description: string; image: ShopifyImage | null } }[];
    };
  };
  const data = await shopifyFetch<CollectionsResponse>(
    COLLECTIONS_QUERY,
    { first: 20 },
  );

  return data.collections.edges.map((e) => ({
    slug: e.node.handle,
    title: e.node.title,
    description: e.node.description || "",
    heroImage: e.node.image?.url || "",
  }));
}

export async function fetchCollectionByHandle(handle: string): Promise<Product[]> {
  const data = await shopifyFetch<CollectionByHandleResponse>(COLLECTION_BY_HANDLE_QUERY, {
    handle,
  });

  if (!data.collection) return [];

  return data.collection.products.edges.map((e) => shopifyProductToLocal(e.node));
}

// ── Search ──────────────────────────────────────────────────────

export function searchShopifyProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/);

  const scored = products.map((p) => {
    const name = p.name.toLowerCase();
    const summary = p.summary.toLowerCase();
    const colour = p.colour.toLowerCase();
    const category = p.category.toLowerCase();
    const collections = p.collections.map((c) => c.replace(/-/g, " ").toLowerCase());
    const design = p.design.map((d) => d.toLowerCase());
    const slug = p.slug.toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (name.includes(term)) score += 10;
      if (name === term) score += 20;
      if (name.startsWith(term)) score += 5;
      if (colour.includes(term)) score += 4;
      if (category.includes(term)) score += 3;
      if (collections.some((c) => c.includes(term))) score += 3;
      if (design.some((d) => d.includes(term))) score += 2;
      if (summary.includes(term)) score += 1;
      if (slug.includes(term)) score += 1;
    }

    return { product: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product);
}
