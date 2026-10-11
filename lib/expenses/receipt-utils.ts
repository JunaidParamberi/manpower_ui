/** Max attachments per expense (storage + UI). */
export const MAX_EXPENSE_RECEIPTS = 10;

export function normalizeReceiptUrls(
  receiptUrls: unknown,
  legacyReceiptUrl: string | null | undefined,
): string[] {
  const fromJson = parseReceiptUrlsJson(receiptUrls);
  if (fromJson.length > 0) {
    return fromJson;
  }
  if (legacyReceiptUrl?.trim()) {
    return [legacyReceiptUrl.trim()];
  }
  return [];
}

function parseReceiptUrlsJson(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string") {
      try {
        const parsed: unknown = JSON.parse(value);
        return parseReceiptUrlsJson(parsed);
      } catch {
        return [];
      }
    }
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}

export function receiptUrlsToJson(urls: string[]): string[] {
  return [...new Set(urls.map((u) => u.trim()).filter(Boolean))].slice(
    0,
    MAX_EXPENSE_RECEIPTS,
  );
}

export function appendReceiptUrls(
  existing: string[],
  added: string[],
): string[] {
  return receiptUrlsToJson([...existing, ...added]);
}

export function removeReceiptUrl(existing: string[], target: string): string[] {
  return existing.filter((url) => url !== target);
}

export function receiptFileLabel(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segment = path.split("/").pop();
    if (segment) return decodeURIComponent(segment);
  } catch {
    /* use fallback */
  }
  return "Receipt";
}
