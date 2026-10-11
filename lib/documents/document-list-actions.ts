"use server";

import { listDocuments } from "@/lib/documents/document-queries";
import {
  sanitizeSearchTerm,
  type ListFilters,
} from "@/lib/documents/list-filters";
import { TYPE_ROUTE_SLUGS } from "@/lib/documents/document-routes";
import type { DocumentType } from "@/types";

/**
 * The document TYPES the list routes can produce — deliberately the *values*
 * of TYPE_ROUTE_SLUGS, not its keys. The keys are URL slugs ("purchase-orders")
 * and the values are types ("local_purchase_order"); switching to Object.keys
 * here would make every check below fail, silently dropping the type filter
 * from Load more so paging escaped the filtered set. The name says TYPES for
 * that reason.
 */
const KNOWN_FILTER_TYPES = new Set<string>(Object.values(TYPE_ROUTE_SLUGS));

/**
 * Filters arrive from the browser, so they are re-validated here rather than
 * trusted: the type must be one the list routes can actually produce, and the
 * search term goes back through the same sanitiser the server route used.
 */
export async function loadMoreDocuments(
  offset: number,
  filters?: Pick<ListFilters, "type" | "search">,
) {
  const type =
    filters?.type && KNOWN_FILTER_TYPES.has(filters.type)
      ? (filters.type as DocumentType)
      : null;

  return listDocuments({
    offset,
    type,
    search: sanitizeSearchTerm(filters?.search),
  });
}
