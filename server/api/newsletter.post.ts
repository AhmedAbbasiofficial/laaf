import { defineEventHandler, readBody, createError } from "h3";
import { shopifyAdminGraphQL } from "../utils/shopify-auth";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const email = (body?.email ?? "").trim().toLowerCase();

    if (!email) {
      throw createError({ statusCode: 400, statusMessage: "Email is required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, statusMessage: "Please enter a valid email address." });
    }

    // Search for existing customer by email
    const searchData = await shopifyAdminGraphQL<{
      customers: { edges: { node: { id: string; email: string } }[] };
    }>(
      `query ($query: String!) {
        customers(first: 1, query: $query) {
          edges { node { id email } }
        }
      }`,
      { query: `email:${email}` },
    );

    const existing = searchData.customers.edges[0]?.node;

    if (existing) {
      // Customer exists — ensure they're subscribed to email marketing
      const updateData = await shopifyAdminGraphQL<{
        customerEmailMarketingConsentUpdate: {
          customer: { id: string; emailMarketingConsent: { marketingState: string } } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>(
        `mutation ($id: ID!, $input: CustomerEmailMarketingConsentInput!) {
          customerEmailMarketingConsentUpdate(id: $id, input: $input) {
            customer {
              id
              emailMarketingConsent { marketingState }
            }
            userErrors { field message }
          }
        }`,
        {
          id: existing.id,
          input: {
            marketingState: "SUBSCRIBED",
            marketingOptInLevel: "SINGLE_OPT_IN",
          },
        },
      );

      if (updateData.customerEmailMarketingConsentUpdate.userErrors.length > 0) {
        console.error("[LAAF] Newsletter update errors:", updateData.customerEmailMarketingConsentUpdate.userErrors);
        throw createError({ statusCode: 500, statusMessage: "Failed to update subscription." });
      }

      return { ok: true, status: "subscribed" };
    }

    // New customer — create with marketing consent
    const createData = await shopifyAdminGraphQL<{
      customerCreate: {
        customer: { id: string } | null;
        userErrors: { field: string[]; message: string }[];
      };
    }>(
      `mutation ($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer { id }
          userErrors { field message }
        }
      }`,
      {
        input: {
          email,
          emailMarketingConsent: {
            marketingState: "SUBSCRIBED",
            marketingOptInLevel: "SINGLE_OPT_IN",
          },
        },
      },
    );

    if (createData.customerCreate.userErrors.length > 0) {
      console.error("[LAAF] Newsletter create errors:", createData.customerCreate.userErrors);
      const msg = createData.customerCreate.userErrors.map((e) => e.message).join("; ");
      throw createError({ statusCode: 500, statusMessage: msg || "Failed to subscribe." });
    }

    return { ok: true, status: "subscribed" };
  } catch (err: any) {
    if (err?.statusCode) throw err;
    console.error("[LAAF] Newsletter error:", err);
    throw createError({ statusCode: 500, statusMessage: "Something went wrong. Please try again." });
  }
});
