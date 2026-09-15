export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const handle = query.handle as string;
  const action = (query.action as string) || "reviews";
  const page = (query.page as string) || "1";
  const perPage = (query.per_page as string) || "50";

  const shopDomain = process.env.JUDGEME_SHOP_DOMAIN;
  const apiToken = process.env.JUDGEME_PRIVATE_API_TOKEN;

  if (!shopDomain || !apiToken) {
    throw createError({ statusCode: 500, statusMessage: "Judge.me not configured" });
  }

  const base = "https://judge.me/api/v1";
  const url = new URL(action === "count" ? `${base}/reviews/count` : `${base}/reviews`);
  url.searchParams.set("shop_domain", shopDomain);
  url.searchParams.set("api_token", apiToken);
  if (handle) url.searchParams.set("handle", handle);
  if (action !== "count") {
    url.searchParams.set("per_page", perPage);
    url.searchParams.set("page", page);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw createError({ statusCode: res.status, statusMessage: `Judge.me API error ${res.status}` });
  }

  return res.json();
});
