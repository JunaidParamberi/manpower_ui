/**
 * Serves the demo's uploaded files (logos, receipts, exports) from
 * `mock-storage/` on disk.
 *
 * The path shape mirrors Supabase's public object URL so the app's existing
 * `extractLogoStoragePath()` helpers keep working:
 * `/storage/v1/object/public/<bucket>/<path…>`
 */
import fs from "node:fs/promises";
import path from "node:path";

import { contentTypeFor } from "@/lib/mock/storage";

type RouteContext = {
  params: Promise<{ bucket: string; path: string[] }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { bucket, path: segments } = await context.params;
  const relative = segments.map((segment) => segment.replace(/\.\./g, "")).join("/");
  const target = path.join(process.cwd(), "mock-storage", bucket, relative);

  try {
    const bytes = await fs.readFile(target);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": contentTypeFor(relative),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
