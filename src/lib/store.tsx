import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addVariantToShopifyCart,
  clearShopifyCart,
  syncBagToShopifyCart,
} from "@/lib/shopify/cart-bridge";

export type BagItem = { slug: string; size: string; length?: string; qty: number };

type Store = {
  bag: BagItem[];
  wishlist: string[];
  bagCount: number;
  wishlistCount: number;
  hydrated: boolean;
  addToBag: (slug: string, size: string, length?: string, qty?: number) => void;
  setQty: (slug: string, size: string, length: string | undefined, qty: number) => void;
  removeFromBag: (slug: string, size: string, length?: string) => void;
  clearBag: () => void;
  toggleWishlist: (slug: string) => void;
  isWished: (slug: string) => boolean;
  bagOpen: boolean;
  setBagOpen: (open: boolean) => void;
};

const StoreContext = createContext<Store | null>(null);
const BAG_KEY = "noorat.bag";
const WISH_KEY = "noorat.wishlist";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [bag, setBag] = useState<BagItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  useEffect(() => {
    setBag(read<BagItem[]>(BAG_KEY, []));
    setWishlist(read<string[]>(WISH_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(BAG_KEY, JSON.stringify(bag));
  }, [bag, hydrated]);

  // Debounced sync to Shopify cart on bag changes
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevBagRef = useRef<string>("");

  useEffect(() => {
    if (!hydrated) return;
    const bagKey = JSON.stringify(bag);
    if (bagKey === prevBagRef.current) return;
    prevBagRef.current = bagKey;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      if (bag.length === 0) {
        clearShopifyCart();
      } else {
        syncBagToShopifyCart(bag).catch(() => {});
      }
    }, 800);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [bag, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  const addToBag = useCallback((slug: string, size: string, length?: string, qty = 1) => {
    setBag((prev) => {
      const found = prev.find((i) => i.slug === slug && i.size === size && i.length === length);
      if (found)
        return prev.map((i) =>
          i.slug === slug && i.size === size && i.length === length ? { ...i, qty: i.qty + qty } : i,
        );
      const newItem: BagItem = length !== undefined
        ? { slug, size, length, qty }
        : { slug, size, qty };
      return [...prev, newItem];
    });
  }, []);

  const setQty = useCallback((slug: string, size: string, length: string | undefined, qty: number) => {
    setBag((prev) =>
      qty <= 0
        ? prev.filter((i) => !(i.slug === slug && i.size === size && i.length === length))
        : prev.map((i) => (i.slug === slug && i.size === size && i.length === length ? { ...i, qty } : i)),
    );
  }, []);

  const removeFromBag = useCallback((slug: string, size: string, length?: string) => {
    setBag((prev) => prev.filter((i) => !(i.slug === slug && i.size === size && i.length === length)));
  }, []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const value = useMemo<Store>(
    () => ({
      bag,
      wishlist,
      hydrated,
      bagCount: bag.reduce((n, i) => n + i.qty, 0),
      wishlistCount: wishlist.length,
      addToBag,
      setQty,
      removeFromBag,
      clearBag: () => setBag([]),
      toggleWishlist,
      isWished: (slug: string) => wishlist.includes(slug),
      bagOpen,
      setBagOpen,
    }),
    [bag, wishlist, hydrated, bagOpen, addToBag, setQty, removeFromBag, toggleWishlist],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}