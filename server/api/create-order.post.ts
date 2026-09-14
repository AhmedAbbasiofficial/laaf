import { defineEventHandler, readBody, createError } from "h3";
import { shopifyAdminGraphQL } from "../utils/shopify-auth";

// ── In-memory idempotency store (resets on cold start) ──────────
const processedRequests = new Map<string, { orderId: string; orderNumber: string }>();

// ── Variant validation query ────────────────────────────────────
const PRODUCT_BY_VARIANT_QUERY = `#graphql
  query ProductByVariant($id: ID!) {
    productVariant(id: $id) {
      id
      title
      availableForSale
      price { amount currencyCode }
      product {
        id
        title
        handle
        availableForSale
      }
    }
  }
`;

// ── Order creation mutation ─────────────────────────────────────
const ORDER_CREATE_MUTATION = `#graphql
  mutation OrderCreate($input: OrderCreateInput!) {
    orderCreate(input: $input) {
      order {
        id
        name
        totalPriceSet {
          shopMoney { amount currencyCode }
        }
        displayFinancialStatus
        displayFulfillmentStatus
        lineItems(first: 50) {
          edges {
            node {
              title
              quantity
              originalUnitPriceSet {
                shopMoney { amount currencyCode }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ── Main handler ────────────────────────────────────────────────
export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // ── 1. Validate request body ────────────────────────────────
  const {
    requestId,
    customer,
    shippingAddress,
    billingAddress,
    shippedToDifferentAddress,
    items,
    paymentMethod,
    subtotal,
    shippingCost,
    total,
    notes,
  } = body as {
    requestId: string;
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    shippingAddress: {
      firstName?: string;
      lastName?: string;
      address: string;
      apartment?: string;
      city: string;
      province: string;
      postalCode?: string;
    };
    billingAddress?: {
      firstName?: string;
      lastName?: string;
      address: string;
      apartment?: string;
      city: string;
      province: string;
      postalCode?: string;
    };
    shippedToDifferentAddress?: boolean;
    items: Array<{
      variantId: string;
      quantity: number;
      price: number;
      slug: string;
    }>;
    paymentMethod: string;
    subtotal: number;
    shippingCost: number;
    total: number;
    notes?: string;
  };

  if (!requestId || typeof requestId !== "string") {
    throw createError({ statusCode: 400, message: "Missing requestId" });
  }

  if (!customer?.firstName || !customer?.lastName || !customer?.phone) {
    throw createError({ statusCode: 400, message: "Missing required customer information" });
  }

  if (!shippingAddress?.address || !shippingAddress?.city) {
    throw createError({ statusCode: 400, message: "Missing shipping address" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({ statusCode: 400, message: "Cart is empty" });
  }

  // ── 2. Idempotency check ──────────────────────────────────
  if (processedRequests.has(requestId)) {
    const existing = processedRequests.get(requestId)!;
    return {
      success: true,
      orderId: existing.orderId,
      orderNumber: existing.orderNumber,
      duplicate: true,
    };
  }

  // ── 3. Validate each variant exists and is available ───────
  const validatedItems: {
    variantGid: string;
    quantity: number;
    price: string;
    title: string;
    productTitle: string;
  }[] = [];

  for (const item of items) {
    if (!item.variantId || !item.quantity || item.quantity < 1) {
      throw createError({
        statusCode: 400,
        message: `Invalid item: ${item.slug || "unknown"}`,
      });
    }

    // Ensure the variant ID is a valid Shopify GID
    const variantGid = item.variantId.startsWith("gid://")
      ? item.variantId
      : `gid://shopify/ProductVariant/${item.variantId}`;

    try {
      const data = await shopifyAdminGraphQL<{
        productVariant: {
          id: string;
          title: string;
          availableForSale: boolean;
          price: { amount: string; currencyCode: string };
          product: { id: string; title: string; handle: string; availableForSale: boolean };
        } | null;
      }>(PRODUCT_BY_VARIANT_QUERY, { id: variantGid });

      if (!data.productVariant) {
        throw createError({
          statusCode: 400,
          message: `Product variant not found: ${item.slug}`,
        });
      }

      if (!data.productVariant.availableForSale) {
        throw createError({
          statusCode: 400,
          message: `Product variant is no longer available: ${data.productVariant.product.title} — ${data.productVariant.title}`,
        });
      }

      validatedItems.push({
        variantGid: data.productVariant.id,
        quantity: item.quantity,
        price: data.productVariant.price.amount,
        title: data.productVariant.title,
        productTitle: data.productVariant.product.title,
      });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "statusCode" in err) throw err;
      throw createError({
        statusCode: 500,
        message: `Failed to validate variant: ${item.slug}`,
      });
    }
  }

  // ── 4. Build Shopify orderCreate input ─────────────────────
  const lineItems = validatedItems.map((vi) => ({
    variantId: vi.variantGid,
    quantity: vi.quantity,
  }));

  const customerName = `${customer.firstName} ${customer.lastName}`.trim();

  const shippingAddr = {
    address1: shippingAddress.address,
    address2: shippingAddress.apartment || "",
    city: shippingAddress.city,
    province: shippingAddress.province || "",
    zip: shippingAddress.postalCode || "",
    country: "Pakistan",
    firstName: shippingAddress.firstName || customer.firstName,
    lastName: shippingAddress.lastName || customer.lastName,
    phone: customer.phone,
  };

  // Use billing address if different, otherwise same as shipping
  const billAddr = shippedToDifferentAddress && billingAddress
    ? {
        address1: billingAddress.address,
        address2: billingAddress.apartment || "",
        city: billingAddress.city,
        province: billingAddress.province || "",
        zip: billingAddress.postalCode || "",
        country: "Pakistan",
        firstName: billingAddress.firstName || customer.firstName,
        lastName: billingAddress.lastName || customer.lastName,
        phone: customer.phone,
      }
    : shippingAddr;

  const orderInput = {
    lineItems,
    shippingAddress: shippingAddr,
    billingAddress: billAddr,
    useDefaultAddress: false,
    financialStatus: "PENDING" as const,
    note: [
      `LAAF Order — ${customerName}`,
      `Phone: ${customer.phone}`,
      customer.email ? `Email: ${customer.email}` : "",
      `Payment: Cash on Delivery`,
      notes ? `Customer notes: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    metafields: [
      {
        namespace: "laaf",
        key: "source",
        value: "laaf_checkout",
        type: "single_line_text_field",
      },
      {
        namespace: "laaf",
        key: "request_id",
        value: requestId,
        type: "single_line_text_field",
      },
      {
        namespace: "laaf",
        key: "payment_method",
        value: paymentMethod || "cod",
        type: "single_line_text_field",
      },
    ],
  };

  // ── 5. Create Shopify order ────────────────────────────────
  try {
    const data = await shopifyAdminGraphQL<{
      orderCreate: {
        order: {
          id: string;
          name: string;
          totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
          displayFinancialStatus: string;
          displayFulfillmentStatus: string;
        } | null;
        userErrors: { field: string; message: string }[];
      };
    }>(ORDER_CREATE_MUTATION, { input: orderInput });

    if (data.orderCreate.userErrors?.length > 0) {
      const msgs = data.orderCreate.userErrors.map((e) => e.message).join("; ");
      console.error("[LAAF] Shopify orderCreate errors:", msgs);
      throw createError({
        statusCode: 400,
        message: `Failed to create order: ${msgs}`,
      });
    }

    if (!data.orderCreate.order) {
      throw createError({
        statusCode: 500,
        message: "Shopify returned no order data",
      });
    }

    const order = data.orderCreate.order;
    const orderId = order.id.replace("gid://shopify/Order/", "");
    const orderNumber = order.name; // e.g. "#1001"

    // ── 6. Store idempotency record ──────────────────────────
    processedRequests.set(requestId, { orderId, orderNumber });

    // Clean up old entries (keep last 1000)
    if (processedRequests.size > 1000) {
      const keys = Array.from(processedRequests.keys());
      for (let i = 0; i < keys.length - 500; i++) {
        processedRequests.delete(keys[i]);
      }
    }

    return {
      success: true,
      orderId,
      orderNumber,
      financialStatus: order.displayFinancialStatus,
      fulfillmentStatus: order.displayFulfillmentStatus,
      total: order.totalPriceSet.shopMoney.amount,
      currency: order.totalPriceSet.shopMoney.currencyCode,
      items: validatedItems.map((vi) => ({
        productTitle: vi.productTitle,
        variantTitle: vi.title,
        quantity: vi.quantity,
        price: vi.price,
      })),
      customer: {
        name: customerName,
        email: customer.email || "",
        phone: customer.phone,
      },
      shippingAddress: {
        address: shippingAddress.address,
        apartment: shippingAddress.apartment || "",
        city: shippingAddress.city,
        province: shippingAddress.province || "",
      },
      paymentMethod: paymentMethod || "cod",
      subtotal,
      shippingCost,
    };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    console.error("[LAAF] Shopify order creation failed:", err);
    throw createError({
      statusCode: 500,
      message: "Failed to create order. Please try again.",
    });
  }
});
