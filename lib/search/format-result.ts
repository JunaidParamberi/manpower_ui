import { documentStatusLabel, documentTypeLabel } from "@/lib/documents/display";
import { projectStatusLabel } from "@/lib/projects/display";
import type { DocumentStatus, DocumentType } from "@/types";

import type {
  GlobalSearchClientResult,
  GlobalSearchDocumentResult,
  GlobalSearchProjectResult,
  GlobalSearchResult,
} from "./types";

const DOCUMENT_TYPE_BADGES: Record<DocumentType, string> = {
  invoice: "INV",
  quote: "QUO",
  proposal: "PRO",
  receipt: "RCT",
  local_purchase_order: "LPO",
  other: "DOC",
  statement: "SOA",
  credit_note: "CN",
  delivery_note: "DN",
};

export function sanitizeIlikePattern(query: string): string {
  return query.replace(/[%_\\,]/g, "");
}

export function buildClientHref(clientId: string): string {
  return `/clients/${clientId}`;
}

export function buildProjectHref(projectId: string): string {
  return `/projects?project=${projectId}`;
}

export function buildDocumentHref(documentId: string): string {
  return `/documents/${documentId}`;
}

type DocumentNumberFields = {
  title: string;
  invoice_number?: string | null;
  quote_number?: string | null;
  proposal_number?: string | null;
  receipt_number?: string | null;
  lpo_number?: string | null;
};

export function getDocumentDisplayNumber(doc: DocumentNumberFields): string {
  return (
    doc.invoice_number ??
    doc.quote_number ??
    doc.proposal_number ??
    doc.receipt_number ??
    doc.lpo_number ??
    doc.title
  );
}

export function formatClientSearchResult(row: {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
}): GlobalSearchClientResult {
  return {
    kind: "client",
    id: row.id,
    label: row.name,
    subtitle: row.company ?? row.email ?? "",
    href: buildClientHref(row.id),
  };
}

export function formatProjectSearchResult(row: {
  id: string;
  title: string;
  status: string;
  client: { name: string } | null;
}): GlobalSearchProjectResult {
  const clientName = row.client?.name ?? "No client";
  const status = projectStatusLabel(row.status as Parameters<typeof projectStatusLabel>[0]);
  return {
    kind: "project",
    id: row.id,
    label: row.title,
    subtitle: `${clientName} · ${status}`,
    href: buildProjectHref(row.id),
    status,
  };
}

export function formatDocumentSearchResult(row: {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  title: string;
  invoice_number?: string | null;
  quote_number?: string | null;
  proposal_number?: string | null;
  receipt_number?: string | null;
  lpo_number?: string | null;
  client: { name: string } | null;
}): GlobalSearchDocumentResult {
  const typeBadge = DOCUMENT_TYPE_BADGES[row.type] ?? "DOC";
  const statusLabel = documentStatusLabel(row.status);
  const clientName = row.client?.name ?? "No client";
  return {
    kind: "document",
    id: row.id,
    label: getDocumentDisplayNumber(row),
    subtitle: `${documentTypeLabel(row.type)} · ${clientName}`,
    href: buildDocumentHref(row.id),
    documentType: row.type,
    typeBadge,
    status: row.status,
    statusLabel,
  };
}

function matchScore(text: string, query: string): number {
  const hay = text.toLowerCase();
  const needle = query.toLowerCase();
  if (hay === needle) return 3;
  if (hay.startsWith(needle)) return 2;
  if (hay.includes(needle)) return 1;
  return 0;
}

export function rankSearchResults<T extends GlobalSearchResult>(
  results: T[],
  query: string,
): T[] {
  return [...results].sort((a, b) => {
    const scoreA = Math.max(
      matchScore(a.label, query),
      matchScore(a.subtitle, query),
    );
    const scoreB = Math.max(
      matchScore(b.label, query),
      matchScore(b.subtitle, query),
    );
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.label.localeCompare(b.label);
  });
}
