const DOMAIN = (
  import.meta.env.VITE_SHOPIFY_STORE_DOMAIN ??
  import.meta.env.SHOPIFY_STORE_DOMAIN ??
  "6c1sjh-w1.myshopify.com"
).replace(/^https?:\/\//, "").replace(/\/$/, "");

const TOKEN =
  import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ??
  import.meta.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN ??
  "";

const API_VERSION = import.meta.env.SHOPIFY_API_VERSION ?? "2026-07";

if (!DOMAIN || !TOKEN) {
  throw new Error(
    "Shopify storefront configuration is missing. Set VITE_SHOPIFY_STORE_DOMAIN and VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN in your environment.",
  );
}

export class ShopifyError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ShopifyError";
  }
}

export async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const url = `https://${DOMAIN}/api/${API_VERSION}/graphql.json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ShopifyError(`Shopify API error ${res.status}: ${body}`, res.status);
    }

    const json = await res.json();

    if (json.errors?.length) {
      throw new ShopifyError(
        json.errors.map((e: any) => e.message).join("; "),
        400,
      );
    }

    return json.data as T;
  } finally {
    clearTimeout(timeout);
  }
}

export { DOMAIN, TOKEN, API_VERSION };
