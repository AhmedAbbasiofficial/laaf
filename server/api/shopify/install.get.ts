import { defineEventHandler, getQuery, sendRedirect } from "h3";
import crypto from "crypto";

const SHOP = (process.env.SHOPIFY_SHOP ?? "").replace(/^https?:\/\//, "").replace(/\.myshopify\.com$/, "").replace(/\/$/, "");
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID ?? "";
const REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI ?? "";
const SCOPES = process.env.SHOPIFY_SCOPES ?? "read_products,read_inventory,write_orders";

export default defineEventHandler(async (event) => {
  if (!SHOP) throw new Error("SHOPIFY_SHOP not set");
  if (!CLIENT_ID) throw new Error("SHOPIFY_CLIENT_ID not set");
  if (!REDIRECT_URI) throw new Error("SHOPIFY_REDIRECT_URI not set");

  const nonce = crypto.randomBytes(16).toString("hex");

  // Store nonce in a signed cookie for CSRF verification
  const { setCookie } = await import("h3");
  setCookie(event, "oauth_state", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
  });

  const authUrl = `https://${SHOP}.myshopify.com/admin/oauth/authorize?` +
    new URLSearchParams({
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      state: nonce,
    });

  return sendRedirect(event, authUrl);
});
