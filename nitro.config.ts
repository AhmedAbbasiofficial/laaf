import { defineNitroConfig } from "nitro/config";

// Use environment variable to select preset, default to node-server for local dev.
// Production deployment (Vercel) sets NITRO_PRESET=vercel at build time.
export default defineNitroConfig({
  preset: (process.env.NITRO_PRESET as any) || "node-server",
  vercel: {
    config: {
      functions: {
        runtime: "nodejs20.x",
      },
    },
  },
});
