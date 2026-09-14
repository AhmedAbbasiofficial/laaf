import { useState } from "react";
import { toast } from "sonner";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex max-w-sm items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setPending(true);
        setTimeout(() => {
          setPending(false);
          setEmail("");
          toast("Thank you — your address has been noted.", {
            description: "Newsletter delivery is not yet connected.",
          });
        }, 500);
      }}
    >
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