import type { Metadata } from "next";

import { TypeDocumentsIndex } from "@/components/features/documents/type-documents-index";
import { sanitizeSearchTerm } from "@/lib/documents/list-filters";

export const metadata: Metadata = { title: "Receipts" };

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  return <TypeDocumentsIndex type="receipt" search={sanitizeSearchTerm(q)} />;
}
