/**
 * LAAF.pk shipping rules — single source of truth.
 *
 * These values mirror what the LAAF storefront currently advertises on the
 * homepage, announcement bar, BagDrawer, FAQ, and product page:
 *
 *   • Free standard delivery on orders ≥ PKR 2,000
 *   • PKR 200 flat-rate standard delivery otherwise
 *   • Standard delivery 3–5 business days across Pakistan
 *   • Express delivery available for major cities (no premium published yet)
 *
 * The shipping cost shown to the customer on the checkout screen MUST come
 * from `calculateShipping()` below — never recomputed or hardcoded anywhere
 * else. If the published policy changes (e.g. express premium, zone-based
 * pricing), update this file only.
 */

export const SHIPPING_CONFIG = {
  /** Subtotal threshold (PKR) above which standard delivery is free. */
  freeShippingThreshold: 2000,
  /** Flat-rate standard delivery fee (PKR) for orders below the threshold. */
  standardShippingFee: 200,
  /** Estimated standard delivery window, displayed alongside the charge. */
  standardDeliveryDays: "3–5 business days",
  /** Cities where express delivery is offered (no published premium yet). */
  expressDeliveryCities: [
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
  ] as const,
} as const;

export type ShippingCalculation =
  | {
      status: "ok";
      fee: number;            // PKR
      isFree: boolean;
      deliveryWindow: string; // e.g. "3–5 business days"
      isExpressAvailable: boolean;
    }
  | {
      status: "calculating";
      fee: null;
      isFree: false;
      deliveryWindow: SHIPPING_CONFIG["standardDeliveryDays"];
      isExpressAvailable: false;
    }
  | {
      status: "error";
      fee: null;
      isFree: false;
      deliveryWindow: SHIPPING_CONFIG["standardDeliveryDays"];
      isExpressAvailable: false;
    };

/**
 * Pure function — same inputs always produce the same output. The checkout
 * calls this on every render so the summary stays in sync with the address
 * the customer is filling in.
 *
 * The optional `city` argument is used purely for the "express available"
 * hint. The published LAAF policy does not charge different rates by city,
 * so the fee itself is the same regardless of city or province.
 */
export function calculateShipping(
  subtotal: number,
  city?: string,
): ShippingCalculation {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return { status: "error", fee: null, isFree: false, deliveryWindow: SHIPPING_CONFIG.standardDeliveryDays, isExpressAvailable: false };
  }
  const isFree = subtotal >= SHIPPING_CONFIG.freeShippingThreshold;
  const normalizedCity = city?.trim().toLowerCase() ?? "";
  const isExpressAvailable =
    !!normalizedCity &&
    (SHIPPING_CONFIG.expressDeliveryCities as readonly string[]).some(
      (c) => c.toLowerCase() === normalizedCity,
    );
  return {
    status: "ok",
    fee: isFree ? 0 : SHIPPING_CONFIG.standardShippingFee,
    isFree,
    deliveryWindow: SHIPPING_CONFIG.standardDeliveryDays,
    isExpressAvailable,
  };
}

/**
 * Asynchronous variant — used by the checkout when it wants to show a brief
 * "Calculating…" state on address change, so the UI mirrors how a real
 * courier API would feel. Resolves with the same payload as
 * `calculateShipping()`. Never rejects.
 */
export function calculateShippingAsync(
  subtotal: number,
  city?: string,
): Promise<ShippingCalculation> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(calculateShipping(subtotal, city)), 350);
  });
}
