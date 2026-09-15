import { defineEventHandler, readBody, createError } from "h3";
import { shopifyAdminGraphQL } from "../utils/shopify-auth";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const name = (body?.name ?? "").trim();
    const email = (body?.email ?? "").trim().toLowerCase();
    const phone = (body?.phone ?? "").trim();
    const message = (body?.message ?? "").trim();

    if (!email) {
      throw createError({ statusCode: 400, statusMessage: "Email is required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, statusMessage: "Please enter a valid email address." });
    }
    if (!message) {
      throw createError({ statusCode: 400, statusMessage: "Message is required." });
    }

    const date = new Date().toISOString().split("T")[0];

    const data = await shopifyAdminGraphQL<{
      metaobjectCreate: {
        metaobject: { handle: string } | null;
        userErrors: { field: string[]; message: string; code?: string }[];
      };
    }>(
      `mutation ($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject { handle }
          userErrors { field message code }
        }
      }`,
      {
        metaobject: {
          type: "contact_form",
          fields: [
            { key: "name", value: name },
            { key: "email", value: email },
            { key: "phone", value: phone },
            { key: "message", value: message },
            { key: "date", value: date },
          ],
        },
      },
    );

    if (data.metaobjectCreate.userErrors.length > 0) {
      console.error("[LAAF] Contact form errors:", data.metaobjectCreate.userErrors);
      const msg = data.metaobjectCreate.userErrors.map((e) => e.message).join("; ");
      throw createError({ statusCode: 500, statusMessage: msg || "Failed to send message." });
    }

    return { ok: true };
  } catch (err: any) {
    if (err?.statusCode) throw err;
    console.error("[LAAF] Contact form error:", err);
    throw createError({ statusCode: 500, statusMessage: "Something went wrong. Please try again." });
  }
});
