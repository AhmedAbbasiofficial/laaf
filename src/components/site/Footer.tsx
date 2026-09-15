import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Facebook, Instagram, CheckCircle2 } from "lucide-react";
import { laafLocation } from "@/lib/site";
import laafLogo from "@/assets/laaf-logo.png";

function FooterNewsletter({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "duplicate">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("idle");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      setPending(false);
      if (!res.ok) {
        setError(data.statusMessage || "Something went wrong. Please try again.");
        return;
      }
      if (data.status === "subscribed") {
        setStatus("success");
        setEmail("");
      }
    } catch {
      setPending(false);
      setError("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-[0.82rem] text-accent">
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span>You're subscribed. Thank you for joining LAAF.</span>
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-2 text-[0.65rem] text-white/40 underline transition-colors hover:text-white/60"
        >
          Subscribe another email
        </button>
      </div>
    );
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); setStatus("idle"); }}
            placeholder="Your email address"
            disabled={pending}
            className="w-full border border-white/20 bg-white/5 px-4 py-3 text-[0.82rem] text-white placeholder:text-white/30 transition-colors focus:border-accent focus:outline-none disabled:opacity-50"
          />
          {error && <p className="mt-1.5 text-[0.65rem] text-sale">{error}</p>}
          {status === "duplicate" && (
            <p className="mt-1.5 text-[0.65rem] text-accent">You're already subscribed to LAAF.</p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-accent py-3 text-[0.7rem] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
    </form>
  );
}

const shopLinks = [
  { to: "/collection", label: "All Abayas" },
  { to: "/collection?sale=1", label: "Sale" },
  { to: "/collection?fresh=1", label: "New Arrivals" },
];

const infoLinks = [
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
  { to: "/signature-details", label: "Our Craftsmanship" },
];

const helpLinks = [
  { to: "/info/shipping", label: "Shipping Policy", params: { slug: "shipping" } },
  { to: "/info/returns", label: "Returns & Exchanges", params: { slug: "returns" } },
  { to: "/info/size-guide", label: "Size Guide", params: { slug: "size-guide" } },
  { to: "/info/privacy", label: "Privacy Policy", params: { slug: "privacy" } },
  { to: "/info/terms", label: "Terms of Service", params: { slug: "terms" } },
];

const socials = [
  { href: laafLocation.socials.instagram, label: "Instagram", Icon: Instagram },
  { href: laafLocation.socials.facebook, label: "Facebook", Icon: Facebook },
  { href: laafLocation.socials.tiktok, label: "TikTok", Icon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )},
];

const mobileSections = [
  {
    id: "contact",
    title: "Get In Touch",
      content: (
      <div className="space-y-3 py-3 text-[0.82rem] text-white/70">
        <a
          href={laafLocation.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:text-white transition-colors"
        >
          {laafLocation.address}
        </a>
        <a href={`tel:${laafLocation.phoneRaw.replace('+','').replace(' ','')}`} className="block hover:text-white transition-colors">{laafLocation.phone}</a>
        <a href={`mailto:${laafLocation.email}`} className="block hover:text-white transition-colors">{laafLocation.email}</a>
        <div className="flex items-center gap-3 pt-2">
          {socials.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="grid h-7 w-7 place-items-center border border-white/15 text-white/60 transition-colors hover:border-white/40 hover:text-white"
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            </a>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "information",
    title: "Information",
    content: (
      <ul className="space-y-2.5 py-3 text-[0.82rem] text-white/70">
        {helpLinks.map(({ to, label, params }) => (
          <li key={label}>
            <Link to={to as any} params={params as any} className="transition-colors hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "discover",
    title: "Discover LAAF.pk",
    content: (
      <ul className="space-y-2.5 py-3 text-[0.82rem] text-white/70">
        {infoLinks.map(({ to, label }) => (
          <li key={label}>
            <Link to={to as any} className="transition-colors hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "newsletter",
    title: "Newsletter",
    content: (
      <div className="space-y-3 py-3">
        <p className="text-[0.82rem] leading-relaxed text-white/70">
          Get first access to new arrivals, exclusive offers, and style inspiration.
        </p>
        <FooterNewsletter />
      </div>
    ),
  },
];

export function Footer() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <footer className="border-t border-border bg-[#111111] text-white">
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-12">
        <div className="hidden py-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-[1.4fr_1fr_1fr_1.5fr] lg:gap-8 lg:py-14">
          <div>
            <Link to="/" aria-label="LAAF home" className="inline-block">
              <div className="overflow-hidden h-[80px] lg:h-[100px] w-[70px] lg:w-[88px] flex items-center justify-center">
                <img
                  src={laafLogo}
                  alt="LAAF"
                  className="h-[280px] lg:h-[350px] w-auto max-w-none mt-[-14px] lg:mt-[-18px]"
                  style={{ filter: "invert(1)", mixBlendMode: "screen" }}
                />
              </div>
            </Link>
            <p className="mt-5 max-w-xs text-[0.8rem] leading-relaxed text-white/60">
              Pakistan's premium abaya and hijab brand. Crafting modern modest fashion for the contemporary woman since 2026.
            </p>
            <div className="mt-5 space-y-2 text-[0.75rem] text-white/50">
              <p>
                📍{" "}
                <a
                  href={laafLocation.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  {laafLocation.address}
                </a>
              </p>
              <p>
                📞 <a href={`tel:${laafLocation.phoneRaw.replace('+','').replace(' ','')}`} className="transition-colors hover:text-white">{laafLocation.phone}</a>
              </p>
              <p>
                ✉️ <a href={`mailto:${laafLocation.email}`} className="transition-colors hover:text-white">{laafLocation.email}</a>
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-8 w-8 place-items-center border border-white/20 text-white/60 transition-all duration-200 hover:border-white/60 hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/50">
              Shop
            </h2>
            <ul className="space-y-3">
              {shopLinks.map(({ to, label }) => (
                <li key={label}>
                  <a href={to} className="text-[0.8rem] text-white/60 transition-colors duration-150 hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <h2 className="mt-8 mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/50">
              Company
            </h2>
            <ul className="space-y-3">
              {infoLinks.map(({ to, label }) => (
                <li key={label}>
                  <a href={to} className="text-[0.8rem] text-white/60 transition-colors duration-150 hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/50">
              Help
            </h2>
            <ul className="space-y-3">
              {helpLinks.map(({ to, label, params }) => (
                <li key={label}>
                  <Link to={to as any} params={params as any} className="text-[0.8rem] text-white/60 transition-colors duration-150 hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/50">
              Stay in the Loop
            </h2>
            <p className="mb-5 text-[0.8rem] leading-relaxed text-white/60">
              Get first access to new arrivals, exclusive offers, and style inspiration. No spam, ever.
            </p>
            <FooterNewsletter />
            <p className="mt-3 text-[0.62rem] leading-relaxed text-white/35">
              By subscribing you agree to our privacy policy and consent to receive marketing emails.
            </p>
          </div>
        </div>

        <div className="md:hidden py-8">
          <Link to="/" aria-label="LAAF home" className="inline-flex">
            <div className="overflow-hidden h-[72px] w-[64px] flex items-center justify-center">
              <img
                src={laafLogo}
                alt="LAAF"
                className="h-[250px] w-auto max-w-none mt-[-12px]"
                style={{ filter: "invert(1)", mixBlendMode: "screen" }}
              />
            </div>
          </Link>
          <p className="mt-5 text-[0.82rem] leading-relaxed text-white/60">
            Pakistan's premium abaya and hijab brand. Crafting modern modest fashion for the contemporary woman since 2026.
          </p>
        </div>

        <div className="space-y-0 border-t border-white/10 py-3 md:hidden">
          {mobileSections.map((section) => {
            const isOpen = activeSection === section.id;

            return (
              <div key={section.id} className="border-b border-white/10 last:border-b-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`footer-panel-${section.id}`}
                  onClick={() => setActiveSection((current) => (current === section.id ? null : section.id))}
                  className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-[0.92rem] font-medium uppercase tracking-[0.12em] text-white/80"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 text-white/70 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    strokeWidth={1.8}
                  />
                </button>

                <div
                  id={`footer-panel-${section.id}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-0 pb-4">{section.content}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.68rem] text-white/40">
            © {new Date().getFullYear()} LAAF. All rights reserved. Made in Pakistan 🇵🇰
          </p>
          <div className="flex items-center gap-4">
            <a href="/info/privacy" className="text-[0.65rem] text-white/35 transition-colors hover:text-white/60">Privacy</a>
            <a href="/info/terms" className="text-[0.65rem] text-white/35 transition-colors hover:text-white/60">Terms</a>
            <div className="flex items-center gap-1.5 text-[0.62rem] text-white/30">
              <span>Payments:</span>
              <span className="font-medium text-white/50">EasyPaisa · COD · Card</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}