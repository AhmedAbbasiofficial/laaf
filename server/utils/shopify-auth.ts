/**
 * Shopify Client Credentials Grant — server-side token helper.
 *
 * Exchanges Client ID + Client Secret for a lifetime Admin API access token.
 * Token is fetched once per server cold start and cached in memory.
 *
 * POST https://{shop}.myshopify.com/admin/oauth/access_token
 * Body: grant_type=client_credentials&client_id=...&client_secret=...
 */

const SHOP = (
  process.env.SHOPIFY_SHOP ?? ""
).replace(/^https?:\/\//, "").replace(/\.myshopify\.com$/, "").replace(/\/$/, "");

const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET ?? "";

// ── In-memory token cache (server-only, never exposed to browser) ──
let cachedToken: string | null = null;

/**
 * Get the Shopify Admin API access token using the Client Credentials Grant.
 * Token is lifetime — fetched once and cached for the server's lifetime.
 */
export async function getShopifyAdminAccessToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  if (!SHOP) throw new Error("SHOPIFY_SHOP environment variable is not set");
  if (!CLIENT_ID) throw new Error("SHOPIFY_CLIENT_ID environment variable is not set");
  if (!CLIENT_SECRET) throw new Error("SHOPIFY_CLIENT_SECRET environment variable is not set");

  const response = await fetch(`https://${SHOP}.myshopify.com/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`[LAAF] Shopify token request failed (${response.status}):`, body);
    throw new Error(`Shopify authentication failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (data.error) {
    console.error("[LAAF] Shopify token error:", data.error, data.error_description);
    throw new Error(`Shopify auth error: ${data.error}`);
  }

  if (!data.access_token) {
    console.error("[LAAF] Shopify token response missing access_token:", data);
    throw new Error("Shopify returned no access token");
  }

  cachedToken = data.access_token;
  return cachedToken;
}

/**
 * Make an authenticated Shopify Admin GraphQL request.
 */
export async function shopifyAdminGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getShopifyAdminAccessToken();

  const res = await fetch(`https://${SHOP}.myshopify.com/admin/api/2026-07/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Shopify Admin API error ${res.status}: ${body}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(
      json.errors.map((e: { message: string }) => e.message).join("; "),
    );
  }

  return json.data as T;
}
