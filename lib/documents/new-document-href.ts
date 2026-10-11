import { documentTypeSchema } from "@/lib/validations/document";
import type { DocumentType } from "@/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The four types you create from the New menu. */
export const NEW_DOCUMENT_TYPES: { type: DocumentType; label: string; hint: string }[] = [
  { type: "invoice", label: "Invoice", hint: "Bill for finished work" },
  { type: "quote", label: "Quote", hint: "Price it before you start" },
  { type: "proposal", label: "Proposal", hint: "Pitch the project" },
  { type: "local_purchase_order", label: "Purchase order", hint: "Record a client's LPO" },
];

/** Where a brand-new draft opens: the editor, flagged so an untouched draft is cleaned up. */
export function editorHrefForNew(id: string): string {
  return `/documents/${id}?edit=1&fresh=1`;
}

export function parseNewDocumentParams(sp: { type?: string; client?: string; projectId?: string; project?: string }) {
  const t = documentTypeSchema.safeParse(sp.type);
  const project = sp.projectId ?? sp.project;
  return {
    type: t.success ? t.data : null,
    clientId: sp.client && UUID.test(sp.client) ? sp.client : null,
    projectId: project && UUID.test(project) ? project : null,
  };
}
