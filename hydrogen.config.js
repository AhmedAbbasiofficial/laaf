import { defineConfig } from '@shopify/hydrogen/config';

export default defineConfig({
  // Shopify configuration
  shopify: {
    // Your Shopify storefront domain
    storefront: {
      id: process.env.SHOPIFY_STOREFRONT_ID,
      publicAccessToken: process.env.SHOPIFY_PUBLIC_ACCESS_TOKEN,
      apiVersion: '2024-01',
    },
  },
  
  // Oxygen deployment configuration
  oxygen: {
    previewableHeaderPattern: /^(?:x-(?:hydrogen|shopify-)?|shopify-)?/i,
  },

  // Build configuration
  build: {
    ssrParam: '_sb',
    splitChunksConfig: false,
    preloadAssets: { query: '_sb', buy: 'image' },
  },

  // Cache configuration
  cache: {
    maxAge: { memory: 1, browser: 3600, staleWhileRevalidate: 86400 },
    mode: 'development',
  },

  // Dev configuration
  dev: {
    port: 3000,
  },
});
