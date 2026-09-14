import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { Loader2, Lock, Truck, Shield, RefreshCw, Banknote } from "lucide-react";
import { useStore, type BagItem } from "@/lib/store";
import { getProduct, formatPrice } from "@/lib/products";
import { calculateShipping } from "@/lib/shipping";
import { cn } from "@/lib/utils";
import { resolveVariantId } from "@/lib/shopify/cart-bridge";
import laafLogo from "@/assets/laaf-logo.png";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — LAAF" },
      { name: "description", content: "Complete your LAAF order." },
    ],
  }),
  component: Checkout,
});

type CheckoutForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof CheckoutForm | "submit" | "items", string>>;

function validate(form: CheckoutForm, items: BagItem[]): FormErrors {
  const e: FormErrors = {};
  if (!form.firstName.trim()) e.firstName = "Required";
  if (!form.lastName.trim()) e.lastName = "Required";
  if (!form.phone.trim()) e.phone = "Required";
  else if (!/^03\d{9}$/.test(form.phone.replace(/\s/g, "")))
    e.phone = "Enter a valid Pakistani phone (03XXXXXXXXX)";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
  if (!form.address.trim()) e.address = "Required";
  if (!form.city.trim()) e.city = "Required";
  if (!form.province.trim()) e.province = "Required";
  if (items.length === 0) e.items = "Your cart is empty";
  return e;
}

function Checkout() {
  const { bag, clearBag } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<CheckoutForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    province: "",
    postalCode: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const items = useMemo(
    () => bag.map((i) => ({ ...i, product: getProduct(i.slug) })).filter((i) => i.product),
    [bag],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.product!.price * it.qty, 0),
    [items],
  );

  const shipping = useMemo(() => calculateShipping(subtotal, form.city), [subtotal, form.city]);
  const shippingCost = shipping.status === "ok" ? shipping.fee : 0;
  const total = subtotal + shippingCost;

  const set = useCallback(
    <K extends keyof CheckoutForm>(key: K, val: CheckoutForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: val })),
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      const errs = validate(form, bag);
      setErrors(errs);
      if (Object.keys(errs).length > 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSubmitting(true);

      try {
        // Build line items with resolved variant IDs
        const lineItems: {
          variantId: string;
          quantity: number;
          price: number;
          slug: string;
        }[] = [];

        for (const item of bag) {
          const product = getProduct(item.slug);
          if (!product) continue;

          const variantId = resolveVariantId(product, item.length, item.size);
          if (!variantId) {
            setErrors({ items: `Unable to find variant for ${product.name}` });
            setSubmitting(false);
            return;
          }

          lineItems.push({
            variantId,
            quantity: item.qty,
            price: product.price,
            slug: item.slug,
          });
        }

        if (lineItems.length === 0) {
          setErrors({ items: "Cart is empty" });
          setSubmitting(false);
          return;
        }

        // Generate unique request ID for idempotency
        const requestId = `laaf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            customer: {
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
              email: form.email.trim(),
              phone: form.phone.trim(),
            },
            shippingAddress: {
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
              address: form.address.trim(),
              apartment: form.apartment.trim(),
              city: form.city.trim(),
              province: form.province.trim(),
              postalCode: form.postalCode.trim(),
            },
            items: lineItems,
            paymentMethod: "cod",
            subtotal,
            shippingCost,
            total,
            notes: form.notes.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to create order");
        }

        // Store order data for the confirmation page
        const orderData = {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          orderDate: new Date().toLocaleDateString("en-PK", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          customer: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          },
          shippingAddress: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            address: form.address.trim(),
            apartment: form.apartment.trim(),
            city: form.city.trim(),
            province: form.province.trim(),
          },
          items: lineItems.map((li) => ({
            slug: li.slug,
            size: bag.find((b) => b.slug === li.slug)?.size || "",
            length: bag.find((b) => b.slug === li.slug)?.length,
            qty: li.quantity,
            price: li.price,
          })),
          subtotal,
          shippingCost,
          total,
          paymentMethod: "cod" as const,
        };

        localStorage.setItem(`laaf_order_${data.orderId}`, JSON.stringify(orderData));

        // Clear cart ONLY after successful order creation
        clearBag();

        // Navigate to thank-you page
        navigate({
          to: "/order-confirmation/$orderId",
          params: { orderId: data.orderId },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        setSubmitError(msg);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        setSubmitting(false);
      }
    },
    [form, bag, subtotal, shippingCost, total, clearBag, navigate],
  );

  if (items.length === 0 && !submitting) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-border">
          <div className="mx-auto flex max-w-[1440px] items-center justify-center py-5 px-4">
            <Link to="/" aria-label="LAAF — home">
              <img
                src={laafLogo}
                alt="LAAF"
                className="h-[40px] md:h-[46px] w-auto object-contain"
              />
            </Link>
          </div>
        </div>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="font-serif text-[1.5rem] text-foreground">Your bag is empty</p>
            <p className="mt-2 text-[0.85rem] text-muted-foreground">
              Add items to your bag before checking out.
            </p>
            <Link
              to="/collection"
              className="mt-6 inline-flex items-center bg-foreground text-white px-8 py-3 text-[0.72rem] font-semibold uppercase tracking-wide hover:bg-accent transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = (error?: string) =>
    cn(
      "w-full border bg-white px-3 py-2.5 text-[0.82rem] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground transition-colors",
      error ? "border-red-500" : "border-border",
    );

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

      <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <h1 className="font-serif text-[1.8rem] md:text-[2.2rem] text-foreground mb-8">Checkout</h1>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-[0.82rem] text-red-700">
            {submitError}
          </div>
        )}

        {errors.items && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-[0.82rem] text-red-700">
            {errors.items}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* ── Left: Form ─────────────────────── */}
            <div className="space-y-8">
              {/* Contact Information */}
              <section>
                <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5">
                  Contact Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      className={inputClass(errors.firstName)}
                      placeholder="First name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-[0.7rem] text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      className={inputClass(errors.lastName)}
                      placeholder="Last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-[0.7rem] text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className={inputClass(errors.phone)}
                      placeholder="03XXXXXXXXX"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-[0.7rem] text-red-600">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={inputClass(errors.email)}
                      placeholder="email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-[0.7rem] text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section>
                <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5">
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      className={inputClass(errors.address)}
                      placeholder="Street address"
                    />
                    {errors.address && (
                      <p className="mt-1 text-[0.7rem] text-red-600">{errors.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                      Apartment, suite, etc.
                    </label>
                    <input
                      type="text"
                      value={form.apartment}
                      onChange={(e) => set("apartment", e.target.value)}
                      className={inputClass()}
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                        City *
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        className={inputClass(errors.city)}
                        placeholder="City"
                      />
                      {errors.city && (
                        <p className="mt-1 text-[0.7rem] text-red-600">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                        Province *
                      </label>
                      <input
                        type="text"
                        value={form.province}
                        onChange={(e) => set("province", e.target.value)}
                        className={inputClass(errors.province)}
                        placeholder="Province"
                      />
                      {errors.province && (
                        <p className="mt-1 text-[0.7rem] text-red-600">{errors.province}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => set("postalCode", e.target.value)}
                        className={inputClass()}
                        placeholder="Postal code"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section>
                <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5">
                  Payment Method
                </h2>
                <div className="border border-border p-4 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Banknote className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                    <div>
                      <p className="text-[0.82rem] font-medium text-foreground">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                        Pay when your order arrives at your doorstep.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Order Notes */}
              <section>
                <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5">
                  Order Notes
                </h2>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className={inputClass()}
                  rows={3}
                  placeholder="Special instructions for your order (optional)"
                />
              </section>
            </div>

            {/* ── Right: Order Summary ─────────────── */}
            <aside className="lg:sticky lg:top-[80px] lg:self-start">
              <div className="border border-border bg-white">
                <div className="p-5 border-b border-border">
                  <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-foreground">
                    Order Summary
                  </h3>
                </div>
                <div className="p-5 space-y-4 max-h-[350px] overflow-y-auto">
                  {items.map((it) => {
                    const img = it.product!.images[0];
                    return (
                      <div key={`${it.slug}-${it.size}-${it.length || ""}`} className="flex gap-3">
                        <div className="relative h-20 w-14 shrink-0 bg-muted">
                          {img && (
                            <img
                              src={img.src}
                              alt={img.alt}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center bg-foreground text-[0.55rem] font-semibold text-white">
                            {it.qty}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.75rem] font-medium text-foreground line-clamp-1">
                            {it.product!.name}
                          </p>
                          <p className="text-[0.65rem] text-muted-foreground">
                            {it.length ? `Length: ${it.length}"` : it.size} · {it.product!.colour}
                          </p>
                          <p className="text-[0.75rem] font-semibold text-foreground mt-1">
                            PKR {(it.product!.price * it.qty).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border px-5 py-5 space-y-3">
                  <div className="flex justify-between text-[0.75rem]">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">PKR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[0.75rem]">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground">
                      {shippingCost === 0 ? (
                        <span className="text-accent font-medium">Free</span>
                      ) : (
                        `PKR ${shippingCost.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-[0.85rem] font-semibold border-t border-border pt-3">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">PKR {total.toLocaleString()}</span>
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
                        <span className="text-[0.58rem] text-muted-foreground leading-tight whitespace-pre-line">
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Place Order */}
                <div className="p-5 border-t border-border">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 bg-foreground text-white px-6 py-3.5 text-[0.72rem] font-semibold uppercase tracking-wide transition-colors",
                      submitting ? "opacity-60 cursor-not-allowed" : "hover:bg-accent",
                    )}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating your order…
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        Place Order
                      </>
                    )}
                  </button>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[0.62rem] text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>Secure checkout</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
