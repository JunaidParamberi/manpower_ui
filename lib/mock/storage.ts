/**
 * File storage for the demo.
 *
 * Bytes live on disk under `mock-storage/<bucket>/<path>` (gitignored) and are
 * served by `app/storage/v1/object/public/...`, so the URLs handed out by
 * `getPublicUrl()` are ordinary relative paths that render in `<img>` tags and
 * still satisfy the app's `extractLogoStoragePath()`-style parsing.
 *
 * Return shapes are typed to match storage-js v2 (`StorageError | null`,
 * `FileObject[] | null`, `data: boolean` from `exists`, …) so call sites keep
 * compiling untouched.
 *
 * Server-only.
 */
import fs from "node:fs/promises";
import path from "node:path";

import type { MockStorageError } from "@/lib/mock/types";

const ROOT = "mock-storage";

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  zip: "application/zip",
  heic: "image/heic",
};

export function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
}

function storageRoot(): string {
  return path.join(process.cwd(), ROOT);
}

function safePath(bucket: string, filePath: string): string {
  const cleanBucket = bucket.replace(/[^a-zA-Z0-9._-]/g, "");
  const cleanPath = filePath.replace(/\.\./g, "").replace(/^\/+/, "");
  return path.join(storageRoot(), cleanBucket, cleanPath);
}

export function publicObjectUrl(bucket: string, filePath: string): string {
  return `/storage/v1/object/public/${bucket}/${filePath.replace(/^\/+/, "")}`;
}

async function toBytes(
  file: File | Blob | ArrayBuffer | Uint8Array | string,
): Promise<Buffer> {
  if (typeof file === "string") {
    if (file.startsWith("data:")) {
      const [, base64] = file.split(",");
      return Buffer.from(base64 ?? "", "base64");
    }
    return Buffer.from(file, "utf8");
  }
  if (file instanceof ArrayBuffer) return Buffer.from(file);
  if (ArrayBuffer.isView(file)) {
    return Buffer.from(file.buffer, file.byteOffset, file.byteLength);
  }
  const blob = file as Blob;
  return Buffer.from(await blob.arrayBuffer());
}

type UploadOptions = { contentType?: string; upsert?: boolean; cacheControl?: string };
type ListOptions = {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: { column: string; order?: "asc" | "desc" };
};
type FileObject = {
  name: string;
  id: string | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
};

export function createMockStorage() {
  return {
    from(bucket: string) {
      return {
        async upload(
          filePath: string,
          file: File | Blob | ArrayBuffer | Uint8Array | string,
          options: UploadOptions = {},
        ): Promise<{
          data: { id: string; path: string; fullPath: string } | null;
          error: MockStorageError | null;
        }> {
          const target = safePath(bucket, filePath);
          try {
            await fs.mkdir(path.dirname(target), { recursive: true });
            if (!options.upsert) {
              const existing = await fs.stat(target).catch(() => null);
              if (existing) {
                return {
                  data: null,
                  error: {
                    statusCode: "409",
                    error: "Duplicate",
                    message: "The resource already exists",
                  },
                };
              }
            }
            const bytes = await toBytes(file);
            await fs.writeFile(target, bytes);
            return {
              data: { id: filePath, path: filePath, fullPath: `${bucket}/${filePath}` },
              error: null,
            };
          } catch (cause) {
            return {
              data: null,
              error: {
                statusCode: "400",
                error: "UploadError",
                message: cause instanceof Error ? cause.message : "Upload failed",
              },
            };
          }
        },

        getPublicUrl(filePath: string): { data: { publicUrl: string } } {
          return { data: { publicUrl: publicObjectUrl(bucket, filePath) } };
        },

        async createSignedUrl(
          filePath: string,
          expiresIn = 3600,
        ): Promise<{
          data: { signedUrl: string; expiresAt: number } | null;
          error: MockStorageError | null;
        }> {
          const target = safePath(bucket, filePath);
          const stat = await fs.stat(target).catch(() => null);
          if (!stat) {
            return { data: null, error: { message: "Object not found", statusCode: "404" } };
          }
          return {
            data: {
              signedUrl: publicObjectUrl(bucket, filePath),
              expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
            },
            error: null,
          };
        },

        async createSignedUrls(
          filePaths: string[],
          expiresIn = 3600,
        ): Promise<{
          data: Array<{ path: string | null; signedUrl: string | null; error: string | null }>;
          error: MockStorageError | null;
        }> {
          const data = await Promise.all(
            filePaths.map(async (filePath) => {
              const result = await this.createSignedUrl(filePath, expiresIn);
              return {
                path: filePath,
                signedUrl: result.data?.signedUrl ?? null,
                error: result.error ? String(result.error.message ?? "error") : null,
              };
            }),
          );
          return { data, error: null };
        },

        async remove(
          filePaths: string[],
        ): Promise<{ data: Array<{ name: string; ok: boolean }>; error: MockStorageError | null }> {
          const data: Array<{ name: string; ok: boolean }> = [];
          for (const filePath of filePaths) {
            const target = safePath(bucket, filePath);
            try {
              await fs.unlink(target);
              data.push({ name: filePath, ok: true });
            } catch {
              data.push({ name: filePath, ok: false });
            }
          }
          return { data, error: null };
        },

        async list(
          prefix = "",
          options: ListOptions = {},
        ): Promise<{ data: FileObject[]; error: MockStorageError | null }> {
          const dir = path.join(storageRoot(), bucket, prefix);
          let entries: string[] = [];
          try {
            entries = await fs.readdir(dir);
          } catch {
            entries = [];
          }
          const filtered = options.search
            ? entries.filter((name) => name.includes(options.search as string))
            : entries;
          const offset = options.offset ?? 0;
          const limit = options.limit ?? 100;
          const page = filtered.slice(offset, offset + limit).map((name) => ({
            name,
            id: name,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
            last_accessed_at: new Date(0).toISOString(),
            metadata: {},
          }));
          if (options.sortBy?.column === "name") {
            page.sort((a, b) =>
              options.sortBy?.order === "desc"
                ? b.name.localeCompare(a.name)
                : a.name.localeCompare(b.name),
            );
          }
          return { data: page, error: null };
        },

        async download(
          filePath: string,
        ): Promise<{ data: Blob | null; error: MockStorageError | null }> {
          try {
            const bytes = await fs.readFile(safePath(bucket, filePath));
            return {
              data: new Blob([bytes], { type: contentTypeFor(filePath) }),
              error: null,
            };
          } catch (cause) {
            return {
              data: null,
              error: {
                message: cause instanceof Error ? cause.message : "Object not found",
                statusCode: "404",
              },
            };
          }
        },

        async exists(filePath: string): Promise<{ data: boolean; error: MockStorageError | null }> {
          const stat = await fs.stat(safePath(bucket, filePath)).catch(() => null);
          return { data: stat !== null, error: null };
        },
      };
    },
  };
}
