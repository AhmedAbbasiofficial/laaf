import { defineEventHandler, getQuery, getCookie, createError } from "h3";
import crypto from "crypto";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET ?? "";
const SCOPES = process.env.SHOPIFY_SCOPES ?? "read_products,read_inventory,write_orders";

function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { code, hmac, shop, state, timestamp } = query as Record<string, string>;

  // ── 1. Validate state (CSRF protection) ──
  const savedState = getCookie(event, "oauth_state");
  if (!state || state !== savedState) {
    throw createError({ statusCode: 403, message: "Invalid state parameter" });
  }

  // ── 2. Validate shop domain ──
  if (!shop || !isValidShopDomain(shop)) {
    throw createError({ statusCode: 400, message: "Invalid shop domain" });
  }

  // ── 3. Verify HMAC ──
  const params = Object.fromEntries(
    Object.entries(query).filter(([key]) => key !== "hmac")
  );
  const message = Object.entries(params)
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const digest = crypto
    .createHmac("sha256", CLIENT_SECRET)
    .update(message)
    .digest("hex");

  if (
    !hmac ||
    !timingSafeEqual(Buffer.from(digest), Buffer.from(String(hmac)))
  ) {
    throw createError({ statusCode: 403, message: "Invalid HMAC" });
  }

  // ── 4. Exchange authorization code for offline access token ──
  const tokenResponse = await fetch(
    `https://${shop}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code as string,
      }),
    }
  );

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text().catch(() => "");
    console.error("[LAAF] Token exchange failed:", tokenResponse.status, body);
    throw createError({
      statusCode: 500,
      message: `Token exchange failed: ${tokenResponse.status}`,
    });
  }

  const data = (await tokenResponse.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (data.error) {
    console.error("[LAAF] Token error:", data.error, data.error_description);
    throw createError({
      statusCode: 500,
      message: `Token error: ${data.error}`,
    });
  }

  if (!data.access_token) {
    throw createError({
      statusCode: 500,
      message: "No access token received",
    });
  }

  // ── 5. Verify all required scopes were granted ──
  const granted = (data.scope ?? "").split(",");
  const required = SCOPES.split(",");
  const missing = required.filter(
    (s) =>
      !granted.includes(s) &&
      !(s.startsWith("read_") && granted.includes(`write_${s.slice(5)}`))
  );

  if (missing.length > 0) {
    throw createError({
      statusCode: 403,
      message: `Missing scopes: ${missing.join(", ")}. Reinstall the app with the required scopes.`,
    });
  }

  // ── 6. Store the token ──
  const tokenData = {
    shop,
    access_token: data.access_token,
    scope: data.scope,
    created_at: new Date().toISOString(),
  };

  // Write to a local file for persistence
  const dataDir = join(process.cwd(), ".data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  const tokenPath = join(dataDir, "shopify-token.json");
  writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));

  console.log("[LAAF] Offline access token stored successfully");
  console.log("[LAAF] Shop:", shop);
  console.log("[LAAF] Scopes:", data.scope);

  // Return success page
  return `<!DOCTYPE html>
<html>
<head><title>LAAF — Shopify Connected</title></head>
<body style="font-family:system-ui;max-width:600px;margin:80px auto;text-align:center">
  <h1 style="color:#1a1a1a">Shopify Connected</h1>
  <p style="color:#666;font-size:18px">Shop: <strong>${shop}</strong></p>
  <p style="color:#666;font-size:18px">Scopes: <strong>${data.scope}</strong></p>
  <p style="color:#1a8917;font-size:20px;font-weight:bold;margin-top:40px">
    Offline access token stored successfully.
  </p>
  <p style="color:#999;font-size:14px;margin-top:20px">
    The token is permanent and will not expire.<br>
    It will remain valid until the app is uninstalled from your store.
  </p>
  <hr style="margin:40px 0;border:none;border-top:1px solid #eee">
  <p style="color:#999;font-size:12px">
    Token file: <code>.data/shopify-token.json</code><br>
    Add this token as SHOPIFY_OFFLINE_ACCESS_TOKEN in your environment variables.
  </p>
</body>
</html>`;
});
