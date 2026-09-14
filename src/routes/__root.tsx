import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { laafLocation } from "@/lib/site";
import { initShopifyProducts, onShopifyDataReady } from "@/lib/products";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/site/Header";
import { AnnouncementCountdownBar } from "@/components/site/AnnouncementCountdownBar";
import { Footer } from "@/components/site/Footer";
import { BagDrawer } from "@/components/site/BagDrawer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <pre className="mt-4 text-xs text-red-500 text-left overflow-auto max-h-40 bg-red-50 p-2 rounded">{error?.message}{error?.stack ? "\n" + error.stack : ""}</pre>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LAAF — Premium Modern Modest Fashion" },
      {
        name: "description",
        content:
          "LAAF is a luxury modest fashion brand offering elevated abayas, hijabs, and contemporary pieces for the modern woman. Premium quality, timeless elegance.",
      },
      { property: "og:site_name", content: "LAAF" },
      { property: "og:title", content: "LAAF — Premium Modern Modest Fashion" },
      {
        property: "og:description",
        content: "Premium modern modest fashion designed for contemporary elegance and quiet luxury.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600&family=Tenor+Sans&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "LAAF",
          description: "Premium modest fashion — elevated abayas, hijabs, and contemporary pieces.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-5 right-4 z-[60] flex flex-col items-end gap-2">
      {/* Tooltip / mini chat bubble */}
      {open && (
        <div className="mb-1 w-[260px] rounded-none border border-border bg-white shadow-lg">
          <div className="bg-[#075E54] px-4 py-3">
            <p className="text-[0.72rem] font-semibold text-white uppercase tracking-wider">LAAF Styling Concierge</p>
            <p className="text-[0.62rem] text-white/80 mt-0.5">Typically replies in minutes</p>
          </div>
          <div className="p-4">
            <p className="text-[0.72rem] text-foreground leading-relaxed">
              Hi! 👋 Need help with sizing, a custom length, or styling advice? Chat with us directly.
            </p>
            <a
              href={`https://wa.me/${laafLocation.phoneRaw}?text=${encodeURIComponent("Hi LAAF! I need help with sizing and styling advice.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 bg-[#25D366] py-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-white hover:bg-[#128C7E] transition-colors"
            >
              <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.99L2 22l5.23-1.371a9.936 9.936 0 0 0 4.782 1.22h.005c5.502 0 9.987-4.477 9.988-9.984A9.988 9.988 0 0 0 12.012 2zm5.78 13.916c-.243.682-1.42 1.25-1.947 1.302-.48.048-.94.223-3.045-.607-2.531-.998-4.148-3.568-4.275-3.738-.124-.168-.992-1.32-.992-2.518 0-1.198.62-1.787.842-2.029.224-.242.484-.303.645-.303.16 0 .323.002.463.008.146.006.342-.056.536.41.198.477.677 1.65.736 1.77.059.122.099.263.018.423-.08.162-.12.263-.24.404-.12.141-.253.315-.36.423-.122.122-.249.255-.107.498.142.242.63 1.037 1.353 1.681.93.83 1.713 1.087 1.956 1.209.242.121.382.102.524-.06.142-.163.605-.705.767-.946.162-.242.323-.202.545-.122.222.08 1.411.666 1.653.787.242.12.403.18.463.283.06.103.06.598-.182 1.28z" />
              </svg>
              Start Chat
            </a>
          </div>
        </div>
      )}
      {/* Bubble trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open WhatsApp chat with LAAF styling concierge"
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] shadow-lg hover:bg-[#128C7E] transition-colors"
      >
        {open ? (
          <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24"><path d="M18.364 5.636a1 1 0 0 0-1.414 0L12 10.586 7.05 5.636a1 1 0 0 0-1.414 1.414L10.586 12l-4.95 4.95a1 1 0 0 0 1.414 1.414L12 13.414l4.95 4.95a1 1 0 0 0 1.414-1.414L13.414 12l4.95-4.95a1 1 0 0 0 0-1.414z" /></svg>
        ) : (
          <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.99L2 22l5.23-1.371a9.936 9.936 0 0 0 4.782 1.22h.005c5.502 0 9.987-4.477 9.988-9.984A9.988 9.988 0 0 0 12.012 2zm5.78 13.916c-.243.682-1.42 1.25-1.947 1.302-.48.048-.94.223-3.045-.607-2.531-.998-4.148-3.568-4.275-3.738-.124-.168-.992-1.32-.992-2.518 0-1.198.62-1.787.842-2.029.224-.242.484-.303.645-.303.16 0 .323.002.463.008.146.006.342-.056.536.41.198.477.677 1.65.736 1.77.059.122.099.263.018.423-.08.162-.12.263-.24.404-.12.141-.253.315-.36.423-.122.122-.249.255-.107.498.142.242.63 1.037 1.353 1.681.93.83 1.713 1.087 1.956 1.209.242.121.382.102.524-.06.142-.163.605-.705.767-.946.162-.242.323-.202.545-.122.222.08 1.411.666 1.653.787.242.12.403.18.463.283.06.103.06.598-.182 1.28z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const [shopifyReady, setShopifyReady] = useState(false);

  useEffect(() => {
    const unsub = onShopifyDataReady(() => setShopifyReady(true));
    initShopifyProducts();
    return unsub;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <a
          href="#main"
          className="eyebrow sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-ink-foreground"
        >
          Skip to content
        </a>
        <AnnouncementCountdownBar />
        <Header />
        <main id="main">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <Footer />
        <BagDrawer />
        <Toaster />
        <WhatsAppWidget />
      </StoreProvider>
    </QueryClientProvider>
  );
}
