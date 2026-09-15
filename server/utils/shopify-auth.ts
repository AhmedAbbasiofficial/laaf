/**
 * Shopify Admin API authentication helper.
 *
 * Priority:
 * 1. Offline access token from OAuth (permanent, from .data/shopify-token.json or SHOPIFY_OFFLINE_ACCESS_TOKEN env)
 * 2. Client Credentials Grant (24-hour, fallback)
 *
 * For orderCreate, an offline access token is required.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SHOP = (
  process.env.SHOPIFY_SHOP ?? ""
).replace(/^https?:\/\//, "").replace(/\.myshopify\.com$/, "").replace(/\/$/, "");

const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET ?? "";

// ── Client Credentials token cache ──
let ccToken: string | null = null;
let ccTokenExpiresAt = 0;
const CC_REFRESH_BUFFER_MS = 60_000;

/**
 * Read the offline access token from the OAuth flow.
 * Checks .data/shopify-token.json first, then SHOPIFY_OFFLINE_ACCESS_TOKEN env var.
 */
function getOfflineAccessToken(): string | null {
  // 1. Check environment variables
  const envToken = process.env.SHOPIFY_OFFLINE_ACCESS_TOKEN ?? process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (envToken) return envToken;

  // 2. Check .data/shopify-token.json
  const tokenPath = join(process.cwd(), ".data", "shopify-token.json");
  if (existsSync(tokenPath)) {
    try {
      const data = JSON.parse(readFileSync(tokenPath, "utf-8"));
      if (data.access_token) return data.access_token;
    } catch {
      // Ignore parse errors
    }
  }

  return null;
}

/**
 * Get a Client Credentials Grant token (24-hour, fallback only).
 */
async function getClientCredentialsToken(): Promise<string> {
  if (ccToken && Date.now() < ccTokenExpiresAt - CC_REFRESH_BUFFER_MS) {
    return ccToken;
  }

  if (!SHOP) throw new Error("SHOPIFY_SHOP not set");
  if (!CLIENT_ID) throw new Error("SHOPIFY_CLIENT_ID not set");
  if (!CLIENT_SECRET) throw new Error("SHOPIFY_CLIENT_SECRET not set");

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
    console.error(`[LAAF] Client Credentials token request failed (${response.status}):`, body);
    throw new Error(`Shopify authentication failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (data.error || !data.access_token) {
    throw new Error(`Shopify auth error: ${data.error}`);
  }

  ccToken = data.access_token;
  ccTokenExpiresAt = Date.now() + (data.expires_in ?? 86399) * 1000;
  return ccToken;
}

/**
 * Get a valid Shopify Admin API access token.
 * Returns the offline access token if available (permanent),
 * otherwise falls back to Client Credentials Grant (24-hour).
 *
 * WARNING: orderCreate requires an offline access token.
 * If only a Client Credentials token is available, orderCreate will fail.
 */
export async function getShopifyAdminAccessToken(): Promise<string> {
  const offlineToken = getOfflineAccessToken();
  if (offlineToken) return offlineToken;

  console.warn("[LAAF] No offline access token found. Falling back to Client Credentials (24h). orderCreate may fail.");
  return getClientCredentialsToken();
}

/**
 * Check whether a valid offline access token is available.
 * Use this to determine if orderCreate will work.
 */
export function hasOfflineAccessToken(): boolean {
  return getOfflineAccessToken() !== null;
}

/**
 * Make an authenticated Shopify Admin GraphQL request.
 */
export async function shopifyAdminGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getShopifyAdminAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`https://${SHOP}.myshopify.com/admin/api/2026-07/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
}
