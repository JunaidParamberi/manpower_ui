import { DocumentDetail } from "@/components/features/documents/document-detail";
import { DocumentsTypeEmpty } from "@/components/features/documents/documents-type-empty";
import {
  DOCUMENT_LIST_PAGE_SIZE,
  listDocuments,
} from "@/lib/documents/document-queries";
import { listRecurringSourceDocumentIds } from "@/lib/recurring/queries";
import type { DocumentListRow, DocumentType } from "@/types";

function isRecurringInvoice(
  doc: DocumentListRow,
  recurringSourceIds: Set<string>,
): boolean {
  return recurringSourceIds.has(doc.id) || Boolean(doc.recurring_invoice_id);
}

/**
 * Detail pane for type-filtered routes: it picks the document to open when the
 * user lands on /documents/<type> without choosing a row.
 *
 * It runs its OWN query. The layout no longer fetches documents (the @list
 * parallel route slot does), and the slot's call uses a different cache key
 * anyway, so there is nothing here to dedupe against — this is a separate,
 * deliberately tiny round trip.
 *
 * It must filter by type in Postgres, not over a loaded page. Fetching the
 * unfiltered list and filtering it here meant that with an unbalanced set
 * — 200 recent quotes, older invoices — the list pane correctly showed 18
 * invoices while this pane rendered "no invoices" beside them.
 */
export async function TypeDocumentsIndex({
  type,
  recurringOnly = false,
  search = null,
}: {
  type: DocumentType;
  recurringOnly?: boolean;
  /** Already-sanitized search term — the same filtered set the list pane shows. */
  search?: string | null;
}) {
  // "Recurring" is a join, not a column, so it cannot be pushed into the
  // query — that path still needs a page of invoices to narrow. Everything
  // else needs exactly one row.
  const needsRecurringNarrowing = recurringOnly && type === "invoice";

  const [result, recurringSourceDocumentIds] = await Promise.all([
    listDocuments({
      type,
      search,
      limit: needsRecurringNarrowing ? DOCUMENT_LIST_PAGE_SIZE : 1,
    }),
    needsRecurringNarrowing
      ? listRecurringSourceDocumentIds()
      : Promise.resolve([]),
  ]);

  let documents = result.ok ? result.documents : [];

  if (needsRecurringNarrowing) {
    const sourceIds = new Set(recurringSourceDocumentIds);
    documents = documents.filter((d) => isRecurringInvoice(d, sourceIds));
  }

  if (documents.length > 0) {
    return <DocumentDetail id={documents[0].id} />;
  }

  return <DocumentsTypeEmpty type={type} />;
}
