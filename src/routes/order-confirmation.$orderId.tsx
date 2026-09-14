import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CheckCircle2, Truck, Shield, RefreshCw, Phone, Mail, MapPin, ArrowUpRight, Banknote, Loader2 } from "lucide-react";
import { getProduct } from "@/lib/products";
import { cn } from "@/lib/utils";
import { laafLocation } from "@/lib/site";
import laafLogo from "@/assets/laaf-logo.png";

interface OrderAddress {
  firstName?: string;
  lastName?: string;
  address: string;
  apartment?: string;
  city: string;
  province: string;
}

interface OrderConfirmationData {
  orderId: string;
  orderDate: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  /** Legacy single-address orders */
  shipping?: OrderAddress;
  billingAddress?: OrderAddress;
  shippingAddress?: OrderAddress;
  shippedToDifferentAddress?: boolean;
  items: Array<{
    slug: string;
    size: string;
    length?: string;
    qty: number;
    price: number;
  }>;
  subtotal: number;
  shippingCost: number;
  shippingCity?: string;
  deliveryWindow?: string;
  total: number;
  paymentMethod: "cod" | "card";
}

function emptyOrder(orderId: string): OrderConfirmationData {
  return {
    orderId,
    orderDate: new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }),
    customer: { firstName: "", lastName: "", email: "", phone: "" },
    billingAddress: { address: "", apartment: "", city: "", province: "" },
    shippingAddress: { address: "", apartment: "", city: "", province: "" },
    shippedToDifferentAddress: false,
    items: [],
    subtotal: 0,
    shippingCost: 0,
    total: 0,
    paymentMethod: "cod" as const,
  };
}

export const Route = createFileRoute("/order-confirmation/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Confirmed — LAAF" },
      { name: "description", content: "Your order has been confirmed. Thank you for shopping with LAAF." },
    ],
  }),
  loader: async ({ params }) => {
    return emptyOrder(params.orderId);
  },
  component: OrderConfirmation,
});

function OrderConfirmation() {
  const loaderData = useLoaderData({ strict: false }) as OrderConfirmationData;
  const [data, setData] = useState<OrderConfirmationData>(loaderData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`laaf_order_${loaderData.orderId}`);
      if (stored) {
        setData(JSON.parse(stored) as OrderConfirmationData);
      }
    } catch {
      // fallback to loader data
    } finally {
      setLoading(false);
    }
  }, [loaderData.orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-border">
          <div className="mx-auto flex max-w-[1440px] items-center justify-center py-5 px-4">
            <Link to="/" aria-label="LAAF — home">
              <img src={laafLogo} alt="LAAF" className="h-[40px] md:h-[46px] w-auto object-contain" />
            </Link>
          </div>
        </div>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-[0.8rem] text-muted-foreground">Loading your order…</p>
          </div>
        </div>
      </div>
    );
  }

  const itemsWithProducts = data.items.map((it) => ({ ...it, product: getProduct(it.slug) }));

  // New orders carry separate billing/shipping; legacy orders only have `shipping`.
  const shippedDifferent = data.shippedToDifferentAddress === true;
  const billing = data.billingAddress ?? data.shipping ?? { address: "", apartment: "", city: "", province: "" };
  const shippingAddr = data.shippingAddress ?? data.shipping ?? billing;
  const shipName = shippedDifferent && shippingAddr.firstName
    ? `${shippingAddr.firstName} ${shippingAddr.lastName ?? ""}`.trim()
    : `${data.customer.firstName} ${data.customer.lastName}`;

  const paymentLabel =
    data.paymentMethod === "card" ? "Credit / Debit Card"
    : "Cash on Delivery (COD)";

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center py-5 px-4">
          <Link to="/" aria-label="LAAF — home">
            <img src={laafLogo} alt="LAAF" className="h-[40px] md:h-[46px] w-auto object-contain" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12 py-10 md:py-16">
        {/* Success State */}
        <div className="text-center mb-10 md:mb-14">
          <div className="grid h-16 w-16 mx-auto place-items-center bg-accent/10 rounded-full mb-6">
            <CheckCircle2 className="h-8 w-8 text-accent" strokeWidth={2} />
          </div>
          <p className="text-[0.65rem] uppercase tracking-[0.15em] font-semibold text-accent mb-2">
            Order Confirmed
          </p>
          <h1 className="font-serif text-[1.8rem] md:text-[2.4rem] lg:text-[2.8rem] text-foreground mb-3">
            Thank You for Your Order
          </h1>
          <p className="text-[0.85rem] md:text-[0.9rem] text-muted-foreground leading-relaxed max-w-md mx-auto">
            Your order has been received and is being processed. You will receive a confirmation email shortly with your order details.
          </p>
        </div>

        {/* Order Number */}
        <div className="mb-10 md:mb-12 p-5 md:p-6 bg-muted/30 border border-border rounded-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[0.65rem] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Order Number</span>
              <span className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground font-medium">#{data.orderId}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[0.65rem] uppercase tracking-[0.1em] font-semibold text-muted-foreground">Placed On</span>
              <span className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground">{data.orderDate}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr]">
          {/* ── Left: Customer & Shipping Info ───────────────────── */}
          <div className="space-y-8">
            {/* Customer Information */}
            <section>
              <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5 flex items-center gap-2">
                <span className="w-6 h-6"></span>
                Customer Information
              </h2>
              <div className="space-y-4 text-[0.82rem]">
                <div className="flex gap-4">
                  <span className="text-muted-foreground w-24 shrink-0">Name</span>
                  <span className="text-foreground">{data.customer.firstName} {data.customer.lastName}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-muted-foreground w-24 shrink-0">Email</span>
                  <span className="text-foreground">{data.customer.email}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-muted-foreground w-24 shrink-0">Phone</span>
                  <span className="text-foreground">{data.customer.phone}</span>
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section>
              <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5 flex items-center gap-2">
                <span className="w-6 h-6"></span>
                Shipping Address
              </h2>
              <div className="space-y-2 text-[0.82rem] text-foreground">
                <p>{shipName}</p>
                <p>{shippingAddr.address}</p>
                {shippingAddr.apartment && <p>{shippingAddr.apartment}</p>}
                <p>{shippingAddr.city}, {shippingAddr.province}</p>
                <p className="text-muted-foreground">Pakistan</p>
              </div>
              {shippedDifferent && (
                <p className="mt-2 text-[0.7rem] text-muted-foreground">
                  Ships to a different address than billing.
                </p>
              )}
            </section>

            {/* Billing Address — shown separately only when different */}
            {shippedDifferent && (
              <section>
                <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5 flex items-center gap-2">
                  <span className="w-6 h-6"></span>
                  Billing Address
                </h2>
                <div className="space-y-2 text-[0.82rem] text-foreground">
                  <p>{data.customer.firstName} {data.customer.lastName}</p>
                  <p>{billing.address}</p>
                  {billing.apartment && <p>{billing.apartment}</p>}
                  <p>{billing.city}, {billing.province}</p>
                  <p className="text-muted-foreground">Pakistan</p>
                </div>
              </section>
            )}

            {/* Payment Method */}
            <section>
              <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5 flex items-center gap-2">
                <span className="w-6 h-6"></span>
                Payment Method
              </h2>
              <p className="text-[0.82rem] text-foreground">{paymentLabel}</p>
              {data.paymentMethod === "card" && (
                <p className="mt-2 text-[0.75rem] text-muted-foreground">
                  Paid securely by credit / debit card. Your card details are never stored on our servers.
                </p>
              )}
            </section>

            {/* LAAF.pk Store Location */}
            <section className="pt-2">
              <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" strokeWidth={1.5} />
                LAAF.pk Store Location
              </h2>
              <div className="space-y-3">
                <div className="space-y-1 text-[0.82rem] text-foreground">
                  <p className="font-medium">{laafLocation.name}</p>
                  <p className="text-muted-foreground">{laafLocation.address}</p>
                </div>
                <a
                  href={laafLocation.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${laafLocation.name} on Google Maps (opens in a new tab)`}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-accent hover:border-accent"
                >
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
                  View on Google Maps
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                </a>
                <p className="text-[0.65rem] text-muted-foreground">
                  Opens Google Maps in a new tab on desktop, or the Maps app on your phone when installed.
                </p>
              </div>
            </section>

            {/* Support */}
            <section className="pt-4 border-t border-border">
              <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-4">Need Help?</h2>
              <div className="flex flex-col sm:flex-row gap-4 text-[0.75rem] text-muted-foreground">
                <Link to="/contact" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4" strokeWidth={1.5} />
                  <span>Contact Us</span>
                </Link>
                <a href={`https://wa.me/${laafLocation.phoneRaw}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4" strokeWidth={1.5} />
                  <span>WhatsApp Support</span>
                </a>
              </div>
            </section>
          </div>

          {/* ── Right: Order Summary ─────────────── */}
          <aside className="sticky top-[80px] self-start">
            <div className="border border-border bg-white">
              <div className="p-5 border-b border-border">
                <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-foreground">
                  Order Summary
                </h3>
              </div>
              <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
                {itemsWithProducts.map((it) => {
                  if (!it.product) return null;
                  const img = it.product.images[0]!;
                  return (
                    <div key={`${it.slug}-${it.size}-${it.length || ""}`} className="flex gap-3">
                      <div className="relative h-20 w-14 shrink-0 bg-muted">
                        <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                        <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center bg-foreground text-[0.55rem] font-semibold text-white">
                          {it.qty}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.75rem] font-medium text-foreground line-clamp-1">{it.product.name}</p>
                        <p className="text-[0.65rem] text-muted-foreground">{it.length ? `Length: ${it.length}"` : it.size} · {it.product.colour}</p>
                        <p className="text-[0.75rem] font-semibold text-foreground mt-1">PKR {(it.product.price * it.qty).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border px-5 py-5 space-y-3">
                <div className="flex justify-between text-[0.75rem]">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">PKR {data.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[0.75rem]">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground">
                    {data.shippingCost === 0 ? (
                      <span className="text-accent font-medium">Free</span>
                    ) : (
                      `PKR ${data.shippingCost.toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[0.85rem] font-semibold border-t border-border pt-3">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">PKR {data.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="border-t border-border p-5">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Banknote, text: "COD Available" },
                    { icon: Shield, text: "100%\nAuthentic" },
                    { icon: RefreshCw, text: "7-Day\nEasy Returns" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex flex-col items-center text-center gap-1">
                      <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                      <span className="text-[0.58rem] text-muted-foreground leading-tight whitespace-pre-line">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Shopping */}
              <div className="p-5 border-t border-border">
                <Link
                  to="/collection"
                  className="w-full inline-flex items-center justify-center bg-foreground text-white px-6 py-3.5 text-[0.7rem] font-semibold uppercase tracking-wide hover:bg-accent transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;