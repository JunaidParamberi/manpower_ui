const BUCKET = "expense-receipts";
const MARKER = `/storage/v1/object/public/${BUCKET}/`;

export function extractReceiptStoragePath(publicUrl: string): string | null {
  const idx = publicUrl.indexOf(MARKER);
  if (idx === -1) return null;
  const path = publicUrl.slice(idx + MARKER.length);
  return path.length > 0 ? path : null;
}

export function extFromReceiptMime(mime: string): string | null {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  return map[mime] ?? null;
}
