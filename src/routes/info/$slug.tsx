import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Shell } from "@/components/site/Section";

const PAGES: Record<string, { title: string; intro: string; content: string }> = {
  shipping: {
    title: "Shipping Policy",
    intro: "Reliable and fast nationwide delivery across Pakistan, plus global shipping options.",
    content:
      "We offer Cash on Delivery (COD) and online card payments across Pakistan.\n\n• Shipping Fees:\n  - Shipping fees are calculated at checkout.\n  - Free Shipping available on qualifying orders nationwide.\n\n• Delivery Timelines:\n  - Standard shipments arrive within 3 to 5 business days.\n  - Express shipping (available for Karachi, Lahore, and Islamabad) delivers within 1 to 2 business days.\n\n• Tracking:\n  - Once your order is dispatched, a tracking ID will be sent via SMS and email. Please check your tracking link for courier updates.\n\n• International Shipping:\n  - We ship worldwide via DHL and FedEx. Shipping rates and custom duties are calculated at checkout based on package weight and destination.",
  },
  returns: {
    title: "Returns & Exchanges",
    intro: "Easy 7-day return and exchange policy for your peace of mind.",
    content:
      "We want you to be completely satisfied with your purchase. If a garment does not fit or meet your expectations, we offer a hassle-free 7-day return and exchange window.\n\n• Eligibility:\n  - Items must be unworn, unwashed, unaltered, and returned in their original packaging with tags intact.\n  - Custom-sized items with length modifications are final sale and only eligible for replacement if defective.\n\n• Return Process:\n  - Contact our support team via WhatsApp (+92 314 530 2577) or email (laafpkk@gmail.com) within 7 days of delivery.\n  - We will arrange a reverse pickup in major cities, or provide instructions on shipping the package to our Karachi warehouse.\n\n• Refunds:\n  - Once approved, refunds are processed via EasyPaisa or to your original payment method within 5 business days of receipt of return.",
  },
  "size-guide": {
    title: "Abaya Length Guide",
    intro: "All LAAF abayas are one-size-fits-all with a relaxed, loose silhouette. Select your preferred length based on your height.",
    content:
      "Measure from the top of your shoulder down to your feet. Choose a longer length if you plan to wear heels.\n\n• Sizing by Height (Abaya Length):\n  - Height 4'11\" – 5'1\" (150–155 cm) → 50\"\n  - Height 5'2\" – 5'3\" (157–160 cm) → 52\"\n  - Height 5'4\" – 5'5\" (162–165 cm) → 54\"\n  - Height 5'6\" – 5'7\" (167–170 cm) → 56\"\n  - Height 5'8\" – 5'9\" (172–175 cm) → 58\"\n  - Height 5'10\" – 6'0\" (178–183 cm) → 60\"\n\nAll abayas are designed with a relaxed, loose fit through the bust and shoulders — no separate chest or waist sizing is needed.\n\nFor custom lengths or personal sizing assistance, contact our WhatsApp Concierge.",
  },
  privacy: {
    title: "Privacy Policy",
    intro: "Your privacy and data security are our highest priority.",
    content:
      "We collect only the essential personal details required to process your order, such as name, shipping address, phone number, and email. All online payments are securely processed through encrypted gateways. We never store credit card numbers on our servers. We do not sell or share customer data with third parties except for shipping agents to execute delivery. Cookies are used strictly to retain items in your shopping bag and monitor page performance.",
  },
  terms: {
    title: "Terms of Service",
    intro: "Terms and conditions governing your shopping experience with LAAF.",
    content:
      "By placing an order on our store, you agree to these Terms of Service. Prices and collections are subject to change. All orders are subject to stock availability. In the event of a pricing or stock error, we reserve the right to cancel or adjust the order. Cash on Delivery (COD) shipments must be accepted upon delivery; refusal of parcels may lead to restriction of COD options for future orders. All designs, media, and embroidery elements are the intellectual property of LAAF.",
  },
};

export const Route = createFileRoute('/info/$slug')({
  head: (ctx: any) => {
    const params = (ctx?.params || {}) as any;
    const page = PAGES[params.slug];
    return {
      meta: [{ title: page ? `${page.title} — LAAF` : 'Info — LAAF' }],
    };
  },
  component: InfoPage,
});

function InfoPage() {
  const params = useParams({ from: Route.id as any });
  const page = PAGES[params.slug as string];

  if (!page) {
    return (
      <Shell className="py-20 md:py-28">
        <p>Page not found.</p>
        <Link to="/">Go home</Link>
      </Shell>
    );
  }

  return (
    <Shell className="py-20 md:py-28">
      <p className="eyebrow text-muted-foreground">{page.title}</p>
      <h1 className="pt-4 font-serif text-3xl">{page.title}</h1>
      <p className="pt-4 text-[0.95rem] md:text-[1rem] text-foreground max-w-prose leading-relaxed">{page.intro}</p>
      <div className="mt-6 text-[0.95rem] md:text-[1rem] text-foreground max-w-prose leading-relaxed whitespace-pre-line">{page.content}</div>
    </Shell>
  );
}

export default InfoPage;
