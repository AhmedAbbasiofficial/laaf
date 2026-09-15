import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/site/Section";
import { laafLocation } from "@/lib/site";

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [
      { title: "Contact — LAAF" },
      { name: "description", content: "Contact the atelier for enquiries and press." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !message) {
      setError("Please provide an email and a message.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.statusMessage || "Failed to send — please try again later.");
        return;
      }
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="border-b border-border py-8 md:py-12">
        <Shell>
          <nav className="text-[0.65rem] text-muted-foreground mb-3 uppercase tracking-wider">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <span className="mx-2">/</span>
            <span className="text-foreground">Contact Us</span>
          </nav>
          <h1 className="font-serif text-[2rem] md:text-[2.8rem] font-normal text-foreground">Contact Us</h1>
        </Shell>
      </div>

      <Shell className="py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          {/* Contact info */}
          <div>
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-accent">Get in Touch</span>
            <h2 className="mt-2 font-serif text-[1.5rem] font-normal text-foreground">We'd love to hear from you</h2>
            <p className="mt-4 text-[0.88rem] leading-relaxed text-muted-foreground">
              Have a question about an order, sizing, or our collections? Our team is here to help.
            </p>
            <div className="mt-8 space-y-4 text-[0.85rem]">
              <div className="flex items-start gap-3">
                <span className="text-accent text-base">📍</span>
                <div>
                  <p className="font-medium text-foreground">Address</p>
                  <a
                    href={laafLocation.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    {laafLocation.address}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent text-base">📞</span>
                <div>
                  <p className="font-medium text-foreground">Phone</p>
                  <a href={`tel:${laafLocation.phoneRaw.replace('+','').replace(' ','')}`} className="text-muted-foreground hover:text-accent transition-colors">{laafLocation.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent text-base">✉️</span>
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <a href={`mailto:${laafLocation.email}`} className="text-muted-foreground hover:text-accent transition-colors">{laafLocation.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent text-base">🕐</span>
                <div>
                  <p className="font-medium text-foreground">Hours</p>
                  <p className="text-muted-foreground">Mon–Sat: 10:00 AM – 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            {success ? (
              <div className="border border-accent/30 bg-accent/5 p-6 text-center">
                <p className="font-serif text-xl text-foreground">Message sent!</p>
                <p className="mt-2 text-[0.85rem] text-muted-foreground">We'll get back to you within 1–2 business days.</p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="mt-5 text-[0.72rem] font-medium uppercase tracking-wide text-accent underline hover:no-underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4">
                <div>
                  <label className="block text-[0.72rem] font-semibold uppercase tracking-wide text-foreground mb-1.5">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-border px-4 py-3 text-[0.88rem] focus:outline-none focus:border-foreground transition-colors"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-semibold uppercase tracking-wide text-foreground mb-1.5">Email *</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    className="w-full border border-border px-4 py-3 text-[0.88rem] focus:outline-none focus:border-foreground transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-semibold uppercase tracking-wide text-foreground mb-1.5">Message *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="w-full border border-border px-4 py-3 text-[0.88rem] focus:outline-none focus:border-foreground transition-colors resize-none"
                    rows={5}
                    placeholder="Tell us how we can help..."
                  />
                </div>

                {error && <div role="alert" className="text-[0.82rem] text-sale">{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent py-3.5 text-[0.72rem] font-semibold uppercase tracking-wide text-white hover:bg-accent/90 transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </Shell>
    </div>
  );
}

export default Contact;
