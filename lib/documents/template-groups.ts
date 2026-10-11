import type { DocumentTemplateRow, DocumentType } from "@/types";

/** Starters only make sense for text-based documents: invoices, quotes and LPOs are built from line items. */
const STARTER_TYPES: DocumentType[] = ["proposal", "other"];

export function groupTemplates(templates: DocumentTemplateRow[], type?: DocumentType | null) {
  const matches = (x: DocumentTemplateRow) => !type || x.type === type;
  return {
    mine: templates.filter((x) => !x.is_system && matches(x)),
    starters: templates.filter(
      (x) => x.is_system && STARTER_TYPES.includes(x.type) && x.name !== "Blank document" && matches(x),
    ),
  };
}
