/**
 * Shopify Client Credentials Grant — server-side token helper.
 *
 * Follows the current Shopify 2026 documentation:
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant
 *
 * POST https://{shop}.myshopify.com/admin/oauth/access_token
 * Body: grant_type=client_credentials&client_id=...&client_secret=...
 * Token lifetime: 24 hours (86399s). Refresh by requesting again.
 */

const SHOP = (
  process.env.SHOPIFY_SHOP ?? ""
).replace(/^https?:\/\//, "").replace(/\.myshopify\.com$/, "").replace(/\/$/, "");

const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET ?? "";

// ── In-memory token cache (server-only, never exposed to browser) ──
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// Refresh 60 seconds before expiry for safety margin
const REFRESH_BUFFER_MS = 60_000;

/**
 * Get a valid Shopify Admin API access token using the Client Credentials Grant.
 * Caches the token server-side and refreshes before expiry.
 *
 * @returns A valid access token string
 * @throws If credentials are missing or the token request fails
 */
export async function getShopifyAdminAccessToken(): Promise<string> {
  // ── 1. Validate environment variables ──
  if (!SHOP) {
    throw new Error("SHOPIFY_SHOP environment variable is not set");
  }
  if (!CLIENT_ID) {
    throw new Error("SHOPIFY_CLIENT_ID environment variable is not set");
  }
  if (!CLIENT_SECRET) {
    throw new Error("SHOPIFY_CLIENT_SECRET environment variable is not set");
  }

  // ── 2. Return cached token if still valid ──
  if (cachedToken && Date.now() < tokenExpiresAt - REFRESH_BUFFER_MS) {
    return cachedToken;
  }

  // ── 3. Request new token from Shopify ──
  const tokenUrl = `https://${SHOP}.myshopify.com/admin/oauth/access_token`;

  const response = await fetch(tokenUrl, {
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
    scope?: string;
    expires_in?: number;
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

  // ── 4. Cache the token with its expiry ──
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 86399) * 1000;

  return cachedToken;
}

/**
 * Make an authenticated Shopify Admin GraphQL request.
 * Automatically handles token acquisition and refresh.
 */
export async function shopifyAdminGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getShopifyAdminAccessToken();

  const url = `https://${SHOP}.myshopify.com/admin/api/2026-07/graphql.json`;

  const res = await fetch(url, {
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
