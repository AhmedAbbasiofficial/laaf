import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Shell } from "@/components/site/Section";

const faqs = [
  {
    id: "size",
    question: "How can I choose the right length for my abaya?",
    answer: (
      <>
        To choose the correct length, refer to our detailed <a href="/info/size-guide" className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">Size Guide</a>. Length is based on your height — simply measure from the top of your shoulder down to your feet. Our lengths range from 50 to 60 inches. If you are unsure, we recommend contacting our styling advisors on WhatsApp.
      </>
    ),
  },
  {
    id: "custom-sizing",
    question: "Can my abaya be made to my size?",
    answer:
      "Yes, we offer custom length adjustments for our abayas to ensure a perfect fit for your height. To request custom alterations, please contact our styling advisors via WhatsApp before placing your order.",
  },
  {
    id: "delivery",
    question: "What delivery information is available for orders in Pakistan?",
    answer: (
      <>
        We offer free standard delivery across Pakistan on qualifying orders. Shipments are delivered within 3 to 5 business days, with Express Shipping (1 to 2 business days) available for major cities. Detailed terms can be checked in our <a href="/info/shipping" className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">Shipping Policy</a>.
      </>
    ),
  },
  {
    id: "cod",
    question: "Do you offer Cash on Delivery in Pakistan?",
    answer:
      "Yes. Cash on Delivery is available nationwide across Pakistan. You can pay in cash directly at your doorstep when your order is delivered.",
  },
  {
    id: "payment",
    question: "Which payment methods does LAAF accept?",
    answer:
      "We accept Cash on Delivery (COD), EasyPaisa, and Visa/Mastercard credit and debit cards. Online payment instructions will be presented at checkout.",
  },
  {
    id: "returns",
    question: "Can I return or exchange my order?",
    answer: (
      <>
        Yes. We offer a 7-day hassle-free return and exchange policy. Items must be unworn, unwashed, and returned in their original packaging with tags intact. Please note that custom-altered abayas are final sale unless there is a manufacturing defect. Learn more in our <a href="/info/returns" className="underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">Returns &amp; Exchanges</a> page.
      </>
    ),
  },
  {
    id: "contact",
    question: "How can I contact LAAF about an order or fit question?",
    answer:
      "You can reach us through our Contact Us form, email us at laafpkk@gmail.com, call our customer care at +92 314 530 2577, or chat with us on WhatsApp at +92 314 530 2577. Our support team is available Monday to Saturday, from 10:00 AM to 7:00 PM.",
  },
] satisfies Array<{ id: string; question: string; answer: ReactNode }>;

export function FAQAccordionItem({
  id,
  question,
  answer,
  open,
  onToggle,
}: {
  id: string;
  question: string;
  answer: ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  const answerId = `faq-answer-${id}`;
  const triggerId = `faq-trigger-${id}`;

  return (
    <div className="border-b border-foreground/15">
      <button
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-[0.875rem] font-medium leading-[1.45] text-foreground transition-colors hover:text-accent md:gap-6 md:py-5 md:text-[1rem]"
      >
        <span className="min-w-0">{question}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-[18px] w-[18px] shrink-0 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
          strokeWidth={1.25}
        />
      </button>
      <div
        id={answerId}
        role="region"
        aria-labelledby={triggerId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className={`min-h-0 overflow-hidden text-[0.8125rem] leading-[1.7] text-muted-foreground transition-opacity duration-300 md:text-[0.875rem] ${open ? "pb-5 opacity-100" : "opacity-0"}`}>
          <div className="max-w-3xl pr-8">{answer}</div>
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="bg-white py-10 md:py-14" aria-labelledby="faq-heading">
      <Shell>
        <div className="mb-6 text-center md:mb-8">
          <p className="text-[1.05rem] font-semibold uppercase leading-none tracking-tight text-foreground md:text-[1.15rem]">Got Questions?</p>
          <h2 id="faq-heading" className="mt-4 font-sans text-[0.72rem] font-normal uppercase leading-none tracking-[0.25em] text-foreground md:text-[0.78rem]">
            We Have Answered Here
          </h2>
        </div>

        <div className="border-y border-foreground/10 bg-[#fafafa] px-5 md:px-10">
          {faqs.map((faq) => (
            <FAQAccordionItem
              key={faq.id}
              {...faq}
              open={openId === faq.id}
              onToggle={() => setOpenId((current) => (current === faq.id ? null : faq.id))}
            />
          ))}
        </div>
      </Shell>
    </section>
  );
}
