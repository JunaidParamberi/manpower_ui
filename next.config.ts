import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

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
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
