import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Initialize OpenNext for local Cloudflare bindings emulation during `next dev`
if (process.env.NODE_ENV !== "production") {
  initOpenNextCloudflareForDev({
    persist: { path: ".wrangler/state/v3" },
  });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/protected", destination: "/dashboard", permanent: true },
      {
        source: "/protected/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
  outputFileTracingRoot: path.join(__dirname),
  /**
   * Avoid broken webpack vendor-chunk resolution for scoped packages
   * (e.g. "Cannot find module './vendor-chunks/@supabase.js'") on server routes
   * that use `lib/supabase/server` + Server Components.
   */
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;