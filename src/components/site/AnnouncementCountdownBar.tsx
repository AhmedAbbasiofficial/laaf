import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SHIPPING_CONFIG } from "@/lib/shipping";

const STORAGE_KEY = "abaya-announce-closed";

const messages = [
  "🎉 AZADI SALE — Up to 40% off on all Abayas",
  `🚚 Free Delivery on orders above PKR ${SHIPPING_CONFIG.freeShippingThreshold.toLocaleString()}`,
  "✨ New Collection Arrivals — Shop Now",
  "💚 Pakistan's #1 Abaya Brand",
  "🎁 Easy Returns within 7 Days",
];

export function AnnouncementCountdownBar() {
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setIsClosed(stored === "true");
    } catch {
      setIsClosed(false);
    }
  }, []);

  const handleClose = () => {
    setIsClosed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  if (isClosed) return null;

  // Duplicate messages for seamless loop
  const allMessages = [...messages, ...messages];

  return (
    <div className="relative w-full bg-[#1a1a1a] text-white" style={{ minHeight: "36px" }}>
      <div className="marquee-track" style={{ height: "36px", alignItems: "center" }}>
        <div className="marquee-inner" style={{ alignItems: "center" }}>
          {allMessages.map((msg, i) => (
            <span key={i} className="marquee-item" style={{ fontSize: "0.72rem", fontFamily: "var(--font-sans)", fontWeight: 400, letterSpacing: "0.04em" }}>
              {msg}
              <span style={{ margin: "0 1.5rem", opacity: 0.4 }}>|</span>
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="Close announcement"
        onClick={handleClose}
        className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center text-white/70 hover:text-white transition-colors focus:outline-none"
        style={{ zIndex: 2 }}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
