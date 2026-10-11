import { emptyTiptapDoc } from "@/lib/validations/document";
import type { DocumentInputForm } from "@/lib/validations/document";
import type { DocumentRow, DocumentTemplateRow } from "@/types";

export function defaultDocumentFormValues(args?: {
  type?: DocumentInputForm["type"];
  template?: DocumentTemplateRow | null;
  client_id?: string | null;
  project_id?: string | null;
}): DocumentInputForm {
  const template = args?.template ?? null;
  return {
    title: "", // blank → named automatically; a template name isn't a document name
    type: args?.type ?? template?.type ?? "other",
    status: "draft",
    client_id: args?.client_id ?? "",
    project_id: args?.project_id ?? "",
    content_json: template?.content_json ?? emptyTiptapDoc(),
  };
}

export function documentInputFromTemplateSelection(args: {
  template: DocumentTemplateRow | null;
  requestedType?: DocumentInputForm["type"] | null;
  requestedClientId?: string | null;
  requestedProjectId?: string | null;
}): DocumentInputForm {
  const defaults = defaultDocumentFormValues({
    template: args.template,
    type: args.requestedType ?? undefined,
    client_id: args.requestedClientId ?? "",
    project_id: args.requestedProjectId ?? "",
  });

  return {
    ...defaults,
    // Blank → createDocument names it automatically ("Quote for Acme — …").
    // A template's name describes the template, not the document.
    title: defaults.title || "",
  };
}

export function documentToFormValues(
  document: DocumentRow,
): DocumentInputForm {
  return {
    title: document.title,
    type: document.type,
    status: document.status,
    client_id: document.client_id ?? "",
    project_id: document.project_id ?? "",
    content_json: document.content_json,
  };
}
