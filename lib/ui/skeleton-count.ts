/** Max rows shown on paginated list tables (clients, projects, documents). */
export const TABLE_PAGE_SIZE = 10;

/** Max invoices on the finance dashboard table. */
export const FINANCE_INVOICE_LIMIT = 20;

const STORAGE_PREFIX = "manpower:skeleton:";

export type SkeletonCountKey =
  | "finance:invoices"
  | "clients:list"
  | "projects:list"
  | "documents:list"
  | "time:today"
  | "time:earlier"
  | "documents:templates";

export function resolveSkeletonCount(
  stored: number | null | undefined,
  cap?: number,
): number {
  const n = stored ?? 0;
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  const floored = Math.floor(n);
  if (cap === undefined) {
    return floored;
  }
  return Math.min(floored, cap);
}

export function skeletonStorageKey(id: SkeletonCountKey): string {
  return `${STORAGE_PREFIX}${id}`;
}

export function getSkeletonCount(id: SkeletonCountKey): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(skeletonStorageKey(id));
    if (raw === null) {
      return null;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setSkeletonCount(id: SkeletonCountKey, count: number): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const safe = Math.max(0, Math.floor(count));
    sessionStorage.setItem(skeletonStorageKey(id), String(safe));
  } catch {
    // sessionStorage unavailable (private mode, quota, etc.)
  }
}

/** Visible list rows for paginated tables (first page only). */
export function paginatedListSkeletonCount(total: number): number {
  return resolveSkeletonCount(total, TABLE_PAGE_SIZE);
}
