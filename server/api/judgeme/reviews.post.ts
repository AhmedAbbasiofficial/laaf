export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const shopDomain = process.env.JUDGEME_SHOP_DOMAIN;
  const apiToken = process.env.JUDGEME_PRIVATE_API_TOKEN;

  if (!shopDomain || !apiToken) {
    throw createError({ statusCode: 500, statusMessage: "Judge.me not configured" });
  }

  const url = new URL("https://judge.me/api/v1/reviews");
  url.searchParams.set("shop_domain", shopDomain);
  url.searchParams.set("api_token", apiToken);

  const payload: Record<string, unknown> = {
    shop_domain: shopDomain,
    platform: body.platform || "shopify",
    name: body.name,
    email: body.email,
    rating: body.rating,
    body: body.body,
  };
  if (body.title) payload["title"] = body.title;
  if (body.id) payload["id"] = body.id;
  if (body.picture_urls?.length) payload["picture_urls"] = body.picture_urls;

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = JSON.parse(text); } catch { /* not JSON */ }

  if (!res.ok) {
    throw createError({ statusCode: res.status, statusMessage: (json["error"] as string) || `Judge.me API error ${res.status}` });
  }

  return json;
});
