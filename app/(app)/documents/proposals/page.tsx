import type { Metadata } from "next";

import { TypeDocumentsIndex } from "@/components/features/documents/type-documents-index";
import { sanitizeSearchTerm } from "@/lib/documents/list-filters";

export const metadata: Metadata = { title: "Proposals" };

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ProposalsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  return <TypeDocumentsIndex type="proposal" search={sanitizeSearchTerm(q)} />;
}
