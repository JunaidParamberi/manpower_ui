import { listDocuments } from "@/lib/documents/document-queries";
import { listRecurringSourceDocumentIds } from "@/lib/recurring/queries";
import { normalizeListFilters } from "@/lib/documents/list-filters";
import { DocumentsDataProvider } from "@/components/features/documents/documents-data-context";
import { DocumentsListPane } from "@/components/features/documents/documents-list-pane";

export type DocumentsListSlotProps = {
  /** First path segment under /documents, when the route has one. */
  slug?: string;
  searchParams: { q?: string; recurring?: string; list?: string };
};

/**
 * Server-side body of the `@list` parallel route slot. It lives here rather
 * than in the slot pages so those stay thin shells: the slot is the only place
 * that receives both the active segment and searchParams on the server, which
 * is what lets type and search filtering happen in Postgres instead of over
 * the loaded page.
 */
export async function DocumentsListSlot({
  slug,
  searchParams,
}: DocumentsListSlotProps) {
  const filters = normalizeListFilters({
    slug,
    list: searchParams.list,
    q: searchParams.q,
    recurring: searchParams.recurring,
  });

  const [result, recurringSourceDocumentIds] = await Promise.all([
    listDocuments({ type: filters.type, search: filters.search }),
    listRecurringSourceDocumentIds(),
  ]);

  return (
    <div className="flex h-full w-full flex-col">
      {result.ok ? null : (
        <div
          role="alert"
          className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {result.message || "Couldn't load documents."} Try refreshing the page.
        </div>
      )}
      <DocumentsDataProvider
        documents={result.ok ? result.documents : []}
        recurringSourceDocumentIds={recurringSourceDocumentIds}
        hasMore={result.ok ? result.hasMore : false}
        filters={filters}
      >
        <DocumentsListPane />
      </DocumentsDataProvider>
    </div>
  );
}
