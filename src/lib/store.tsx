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
import { getProduct } from "@/lib/products";

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
  if (typeof window === "undefined" || !window.localStorage) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [bag, setBag] = useState<BagItem[]>(() => read<BagItem[]>(BAG_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => read<string[]>(WISH_KEY, []));
  const [hydrated, setHydrated] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  // Seed the authoritative LAAF bag and wishlist from the browser
  // localStorage keys synchronously so the checkout route never sees an
  // empty bag during the render that should be using the persisted cart.
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(BAG_KEY, JSON.stringify(bag));
  }, [bag, hydrated]);

  // Debounced sync to Shopify cart on bag changes
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevBagRef = useRef<string>("");

  // After hydration, initialize prevBagRef to the current bag so the sync effect
  // doesn't treat the initial hydration load as a "change" and clear the Shopify cart.
  useEffect(() => {
    if (hydrated) {
      prevBagRef.current = JSON.stringify(bag);
    }
  }, [hydrated]); // intentionally runs only when hydrated transitions true

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
    if (hydrated && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, hydrated]);

  const addToBag = useCallback((slug: string, size: string, length?: string, qty = 1) => {
    const product = getProduct(slug);
    if (product?.shopifyVariants && product.shopifyVariants.length > 0) {
      const targetVariant = product.shopifyVariants.find((v) => {
        if (!v.availableForSale) return false;
        if (length) {
          return v.selectedOptions.some(
            (opt) =>
              opt.name.toLowerCase().includes("length") &&
              (opt.value === `${length}"` || opt.value === length),
          ) || v.title.includes(`${length}"`) || v.title.includes(length);
        }
        return true;
      });
      if (!targetVariant) return;
    }

    setBag((prev) => {
      const found = prev.find((i) => i.slug === slug && i.size === size && i.length === length);
      const next = found
        ? prev.map((i) =>
            i.slug === slug && i.size === size && i.length === length ? { ...i, qty: i.qty + qty } : i,
          )
        : [...prev, length !== undefined
            ? { slug, size, length, qty }
            : { slug, size, qty }];
      try { window.localStorage.setItem(BAG_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const setQty = useCallback((slug: string, size: string, length: string | undefined, qty: number) => {
    setBag((prev) => {
      const next = qty <= 0
        ? prev.filter((i) => !(i.slug === slug && i.size === size && i.length === length))
        : prev.map((i) => (i.slug === slug && i.size === size && i.length === length ? { ...i, qty } : i));
      try { window.localStorage.setItem(BAG_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeFromBag = useCallback((slug: string, size: string, length?: string) => {
    setBag((prev) => {
      const next = prev.filter((i) => !(i.slug === slug && i.size === size && i.length === length));
      try { window.localStorage.setItem(BAG_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
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
      clearBag: () => { setBag([]); try { window.localStorage.setItem(BAG_KEY, "[]"); } catch {} },
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