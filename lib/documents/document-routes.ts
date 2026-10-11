import type { DocumentType } from "@/types";

/** URL slug → DocumentType. Only the common types get a dedicated route. */
export const TYPE_ROUTE_SLUGS = {
  invoices: "invoice",
  quotes: "quote",
  proposals: "proposal",
  "purchase-orders": "local_purchase_order",
  receipts: "receipt",
} as const satisfies Record<string, DocumentType>;

export type TypeRouteSlug = keyof typeof TYPE_ROUTE_SLUGS;

const SLUG_BY_TYPE = Object.fromEntries(
  Object.entries(TYPE_ROUTE_SLUGS).map(([slug, type]) => [type, slug]),
) as Partial<Record<DocumentType, TypeRouteSlug>>;

export function isTypeSlug(segment: string): segment is TypeRouteSlug {
  return Object.prototype.hasOwnProperty.call(TYPE_ROUTE_SLUGS, segment);
}

export function typeFromSlug(slug: string): DocumentType | null {
  return isTypeSlug(slug) ? TYPE_ROUTE_SLUGS[slug] : null;
}

export function slugFromType(type: DocumentType): TypeRouteSlug | null {
  return SLUG_BY_TYPE[type] ?? null;
}

const LIST_QUERY_KEY = "list";

/**
 * Mirrors the uuid guard in `app/(app)/documents/@list/[id]/page.tsx` — the
 * same predicate, kept in one place so it can't drift into a second uuid
 * check elsewhere in the feature.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extracts the open document's id from a `/documents/...` pathname, or
 * `null` when the pathname does not name a document — `/documents`,
 * `/documents/new`, a type-slug route (`/documents/invoices`, etc.), or
 * anything whose first segment is not a uuid.
 *
 * Pathname-derived, not `useSelectedLayoutSegment()`-derived: the caller
 * (`DocumentsListPane`) now lives in the `@list` parallel route slot, whose
 * segment tree resolves independently of the children `[id]` route tree.
 * `useSelectedLayoutSegment()` there never sees the document id — only the
 * pathname is shared between both trees.
 */
export function documentIdFromPathname(pathname: string): string | null {
  const segment = pathname.match(/^\/documents\/([^/]+)(?:\/edit)?\/?$/)?.[1];
  if (!segment) return null;
  return UUID_RE.test(segment) ? segment : null;
}

/**
 * List filter from URL only — never inferred from the open document's type.
 *   - /documents/quotes           → quote
 *   - /documents/{uuid}?list=quotes → quote (detail opened from type tab)
 *   - /documents or /documents/{uuid} → null ("all")
 */
export function deriveActiveTypeFromPathname(
  pathname: string,
  listQuery?: string | null,
): DocumentType | null {
  const segment = pathname.match(/^\/documents\/([^/]+)/)?.[1];
  if (segment) {
    const fromPath = typeFromSlug(segment);
    if (fromPath) return fromPath;
  }
  if (listQuery) {
    const fromQuery = typeFromSlug(listQuery);
    if (fromQuery) return fromQuery;
  }
  return null;
}

export function documentListQueryKey(): string {
  return LIST_QUERY_KEY;
}

/** Build detail href preserving the current list filter (All vs type tab). */
export function documentDetailHref(
  documentId: string,
  activeType: DocumentType | null,
): string {
  const slug = activeType ? slugFromType(activeType) : null;
  if (!slug) return `/documents/${documentId}`;
  return `/documents/${documentId}?${LIST_QUERY_KEY}=${slug}`;
}

/**
 * @deprecated Use deriveActiveTypeFromPathname — document ids must not imply list filter.
 */
export function deriveActiveType(
  segments: string[],
  _documents: { id: string; type: DocumentType }[],
): DocumentType | null {
  const first = segments[0];
  if (!first) return null;
  return typeFromSlug(first);
}

/** Sidebar / nav sub-items for the Documents section. */
export const DOCUMENT_TYPE_NAV: { label: string; href: string }[] = [
  { label: "All", href: "/documents" },
  { label: "Invoices", href: "/documents/invoices" },
  { label: "Quotes", href: "/documents/quotes" },
  { label: "Proposals", href: "/documents/proposals" },
  { label: "Purchase orders", href: "/documents/purchase-orders" },
  { label: "Receipts", href: "/documents/receipts" },
];
