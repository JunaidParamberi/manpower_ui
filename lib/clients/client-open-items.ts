import type { DocumentStatus, DocumentType, ProjectStatus } from "@/types";

type OpenProject = { status: ProjectStatus; deadline: string | null };
type OpenDocument = { type: DocumentType; status: DocumentStatus; due_date: string | null; created_at: string };

const OPEN_PROJECT = new Set<ProjectStatus>(["planning", "active", "on_hold"]);
const OPEN_INVOICE = new Set<DocumentStatus>(["sent", "viewed", "partially_paid"]);
const OPEN_OFFER = new Set<DocumentStatus>(["sent", "viewed"]);

/** Projects still in play, soonest deadline first, undated last. */
export function openProjects<T extends OpenProject>(projects: T[], limit = 5): T[] {
  return projects
    .filter((p) => OPEN_PROJECT.has(p.status))
    .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"))
    .slice(0, limit);
}

/** Unpaid invoices and quotes/proposals awaiting an answer, earliest due first. */
export function openDocuments<T extends OpenDocument>(documents: T[], limit = 5): T[] {
  return documents
    .filter((d) =>
      d.type === "invoice"
        ? OPEN_INVOICE.has(d.status)
        : (d.type === "quote" || d.type === "proposal") && OPEN_OFFER.has(d.status),
    )
    .sort(
      (a, b) =>
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
        b.created_at.localeCompare(a.created_at),
    )
    .slice(0, limit);
}
