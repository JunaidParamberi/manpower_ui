import type { DocumentStatus, DocumentType } from "@/types";

export type GlobalSearchEntityKind = "client" | "project" | "document";

export type GlobalSearchResultBase = {
  id: string;
  kind: GlobalSearchEntityKind;
  label: string;
  subtitle: string;
  href: string;
};

export type GlobalSearchClientResult = GlobalSearchResultBase & {
  kind: "client";
};

export type GlobalSearchProjectResult = GlobalSearchResultBase & {
  kind: "project";
  status: string;
};

export type GlobalSearchDocumentResult = GlobalSearchResultBase & {
  kind: "document";
  documentType: DocumentType;
  typeBadge: string;
  status: DocumentStatus;
  statusLabel: string;
};

export type GlobalSearchResult =
  | GlobalSearchClientResult
  | GlobalSearchProjectResult
  | GlobalSearchDocumentResult;

export type GlobalSearchResults = {
  clients: GlobalSearchClientResult[];
  projects: GlobalSearchProjectResult[];
  documents: GlobalSearchDocumentResult[];
};
