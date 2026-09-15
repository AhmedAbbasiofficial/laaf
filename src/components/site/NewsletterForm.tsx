import { useState } from "react";
import { toast } from "sonner";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
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
        toast("Something went wrong.", { description: data.statusMessage || "Please try again." });
        return;
      }
      setEmail("");
      toast("Thank you — you're subscribed to LAAF.");
    } catch {
      setPending(false);
      toast("Network error.", { description: "Please try again later." });
    }
  };

  return (
    <form className="flex max-w-sm items-end gap-3" onSubmit={handleSubmit}>
      <div className="flex-1">
        <label htmlFor="newsletter-email" className="eyebrow text-muted-foreground">
          Email
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full border-b border-border bg-transparent pb-2 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="eyebrow border-b border-foreground pb-2 transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {pending ? "Sending" : "Join"}
      </button>
    </form>
  );
}