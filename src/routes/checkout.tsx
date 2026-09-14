import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Loader2, Lock, Truck, Shield, RefreshCw, Banknote, Building2, Copy, Check } from "lucide-react";
import { useStore, type BagItem } from "@/lib/store";
import { getProduct, formatPrice, getActiveProducts, isShopifyLoading, onShopifyDataReady } from "@/lib/products";
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
  if (items.length === 0) e.items = "Your cart is empty";
  return e;
}

type ShippingForm = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  postalCode: string;
};

type ShippingErrors = Partial<Record<keyof ShippingForm, string>>;

function validateShipping(form: ShippingForm): ShippingErrors {
  const e: ShippingErrors = {};
  if (!form.firstName.trim()) e.firstName = "Required";
  if (!form.lastName.trim()) e.lastName = "Required";
  if (!form.phone.trim()) e.phone = "Required";
  else if (!/^03\d{9}$/.test(form.phone.replace(/\s/g, "")))
    e.phone = "Enter a valid Pakistani phone (03XXXXXXXXX)";
  if (!form.address.trim()) e.address = "Required";
  if (!form.city.trim()) e.city = "Required";
  return e;
}

function Checkout() {
  const { bag, clearBag, hydrated } = useStore();
  const navigate = useNavigate();
  const [shopifyReady, setShopifyReady] = useState(() => !isShopifyLoading() && getActiveProducts().length > 0);

  useEffect(() => {
    if (shopifyReady) return;
    return onShopifyDataReady(() => setShopifyReady(true));
  }, [shopifyReady]);

  const productsReady = shopifyReady;

  const [form, setForm] = useState<CheckoutForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    postalCode: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");
  const [accountCopied, setAccountCopied] = useState(false);
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    postalCode: "",
  });
  const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({});

  const items = useMemo(
    () => bag.map((i) => ({ ...i, product: getProduct(i.slug) })).filter((i) => i.product),
    [bag, productsReady],
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

  const setS = useCallback(
    <K extends keyof ShippingForm>(key: K, val: ShippingForm[K]) =>
      setShippingForm((prev) => ({ ...prev, [key]: val })),
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

      // Validate alternate shipping address when enabled
      if (shipToDifferentAddress) {
        const sErrs = validateShipping(shippingForm);
        setShippingErrors(sErrs);
        if (Object.keys(sErrs).length > 0) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      } else {
        setShippingErrors({});
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
            primaryAddress: {
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
              address: form.address.trim(),
              apartment: form.apartment.trim(),
              city: form.city.trim(),
              postalCode: form.postalCode.trim(),
            },
            shippingAddress: shipToDifferentAddress
              ? {
                  firstName: shippingForm.firstName.trim(),
                  lastName: shippingForm.lastName.trim(),
                  phone: shippingForm.phone.trim(),
                  address: shippingForm.address.trim(),
                  apartment: shippingForm.apartment.trim(),
                  city: shippingForm.city.trim(),
                  postalCode: shippingForm.postalCode.trim(),
                }
              : null,
            shipToDifferentAddress,
            items: lineItems,
            paymentMethod,
            subtotal,
            shippingCost,
            total,
            notes: form.notes.trim(),
          }),
        });

        let data: { success?: boolean; message?: string; orderId?: string; orderNumber?: string; [key: string]: unknown } = {};
        try {
          data = await res.json();
        } catch {
          // Empty or non-JSON body — surface a clear error instead of "Unexpected end of JSON input"
          throw new Error(
            res.ok
              ? "Server returned an unexpected response. Please try again."
              : `Server error (${res.status}). Please try again.`,
          );
        }

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
          paymentMethod,
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
    [form, bag, subtotal, shippingCost, total, clearBag, navigate, shipToDifferentAddress, shippingForm],
  );

  if (!hydrated || !productsReady) {
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
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-foreground" />
            <p className="mt-4 font-serif text-[1.5rem] text-foreground">Loading your bag…</p>
            <p className="mt-2 text-[0.85rem] text-muted-foreground">
              Preparing your checkout.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

              {/* Primary Address */}
              <section>
                <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5">
                  Address
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
                  <div className="grid gap-4 sm:grid-cols-2">
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

              {/* Ship to a different address? */}
              <section>
                <label className="flex cursor-pointer items-center gap-3 select-none group">
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center border-2 transition-colors",
                      shipToDifferentAddress
                        ? "border-foreground bg-foreground"
                        : "border-border bg-white group-hover:border-foreground/40",
                    )}
                  >
                    {shipToDifferentAddress && (
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={shipToDifferentAddress}
                    onChange={(e) => {
                      setShipToDifferentAddress(e.target.checked);
                      if (!e.target.checked) setShippingErrors({});
                    }}
                  />
                  <span className="text-[0.82rem] text-foreground">
                    Ship to a different address?
                  </span>
                </label>
              </section>

              {/* Alternate Shipping Address — shown only when checked */}
              {shipToDifferentAddress && (
                <section className="border-l-2 border-foreground/10 pl-4">
                  <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5">
                    Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={shippingForm.firstName}
                          onChange={(e) => setS("firstName", e.target.value)}
                          className={inputClass(shippingErrors.firstName)}
                          placeholder="First name"
                        />
                        {shippingErrors.firstName && (
                          <p className="mt-1 text-[0.7rem] text-red-600">{shippingErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={shippingForm.lastName}
                          onChange={(e) => setS("lastName", e.target.value)}
                          className={inputClass(shippingErrors.lastName)}
                          placeholder="Last name"
                        />
                        {shippingErrors.lastName && (
                          <p className="mt-1 text-[0.7rem] text-red-600">{shippingErrors.lastName}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) => setS("phone", e.target.value)}
                        className={inputClass(shippingErrors.phone)}
                        placeholder="03XXXXXXXXX"
                      />
                      {shippingErrors.phone && (
                        <p className="mt-1 text-[0.7rem] text-red-600">{shippingErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                        Address *
                      </label>
                      <input
                        type="text"
                        value={shippingForm.address}
                        onChange={(e) => setS("address", e.target.value)}
                        className={inputClass(shippingErrors.address)}
                        placeholder="Street address"
                      />
                      {shippingErrors.address && (
                        <p className="mt-1 text-[0.7rem] text-red-600">{shippingErrors.address}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                        Apartment, suite, etc.
                      </label>
                      <input
                        type="text"
                        value={shippingForm.apartment}
                        onChange={(e) => setS("apartment", e.target.value)}
                        className={inputClass()}
                        placeholder="Apartment, suite, etc. (optional)"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                          City *
                        </label>
                        <input
                          type="text"
                          value={shippingForm.city}
                          onChange={(e) => setS("city", e.target.value)}
                          className={inputClass(shippingErrors.city)}
                          placeholder="City"
                        />
                        {shippingErrors.city && (
                          <p className="mt-1 text-[0.7rem] text-red-600">{shippingErrors.city}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[0.7rem] font-medium uppercase tracking-wide text-foreground mb-1.5">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={shippingForm.postalCode}
                          onChange={(e) => setS("postalCode", e.target.value)}
                          className={inputClass()}
                          placeholder="Postal code"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Payment Method */}
              <section>
                <h2 className="font-serif text-[1.1rem] md:text-[1.3rem] text-foreground mb-5">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {/* COD Option */}
                  <label
                    className={cn(
                      "flex items-center gap-3 border p-4 cursor-pointer transition-colors",
                      paymentMethod === "cod"
                        ? "border-foreground bg-muted/20"
                        : "border-border bg-white hover:border-foreground/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        paymentMethod === "cod" ? "border-foreground" : "border-border",
                      )}
                    >
                      {paymentMethod === "cod" && (
                        <span className="h-2 w-2 rounded-full bg-foreground" />
                      )}
                    </span>
                    <Banknote className="h-5 w-5 text-foreground shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-[0.82rem] font-medium text-foreground">
                        Cash on Delivery (COD)
                      </p>
                      <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                        Pay when your order arrives at your doorstep.
                      </p>
                    </div>
                  </label>

                  {/* Bank Transfer Option */}
                  <label
                    className={cn(
                      "flex items-start gap-3 border p-4 cursor-pointer transition-colors",
                      paymentMethod === "bank_transfer"
                        ? "border-foreground bg-muted/20"
                        : "border-border bg-white hover:border-foreground/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={() => setPaymentMethod("bank_transfer")}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors mt-0.5",
                        paymentMethod === "bank_transfer" ? "border-foreground" : "border-border",
                      )}
                    >
                      {paymentMethod === "bank_transfer" && (
                        <span className="h-2 w-2 rounded-full bg-foreground" />
                      )}
                    </span>
                    <Building2 className="h-5 w-5 text-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.82rem] font-medium text-foreground">
                        Bank Transfer
                      </p>
                      <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                        Transfer to our UBL account and send the screenshot.
                      </p>
                    </div>
                  </label>

                  {/* Bank Transfer Details (expanded) */}
                  {paymentMethod === "bank_transfer" && (
                    <div className="border border-border bg-muted/10 p-4 sm:p-5 space-y-4">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-foreground">
                        Bank Transfer Details
                      </p>
                      <div className="space-y-3 text-[0.82rem]">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="text-[0.68rem] text-muted-foreground uppercase tracking-wide">Bank Name</p>
                            <p className="text-foreground font-medium mt-0.5">UBL</p>
                          </div>
                        </div>
                        <div className="border-t border-border pt-3">
                          <p className="text-[0.68rem] text-muted-foreground uppercase tracking-wide">Account Holder</p>
                          <p className="text-foreground font-medium mt-0.5">Fahad Zaib Satti</p>
                        </div>
                        <div className="border-t border-border pt-3">
                          <p className="text-[0.68rem] text-muted-foreground uppercase tracking-wide">Account Number</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-foreground font-semibold font-mono tracking-wider text-[0.9rem]">0209250277841</p>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText("0209250277841");
                                setAccountCopied(true);
                                setTimeout(() => setAccountCopied(false), 2000);
                              }}
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wide border transition-colors",
                                accountCopied
                                  ? "border-accent text-accent bg-accent/5"
                                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground",
                              )}
                            >
                              {accountCopied ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-border pt-3">
                        <p className="text-[0.75rem] text-muted-foreground leading-relaxed">
                          After making the bank transfer, please send your payment screenshot on WhatsApp. You'll see a WhatsApp button on the order confirmation page after placing your order.
                        </p>
                      </div>
                    </div>
                  )}
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
