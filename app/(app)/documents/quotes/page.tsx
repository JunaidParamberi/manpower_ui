import type { Metadata } from "next";

import { TypeDocumentsIndex } from "@/components/features/documents/type-documents-index";
import { sanitizeSearchTerm } from "@/lib/documents/list-filters";

export const metadata: Metadata = { title: "Quotes" };

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function QuotesPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  return <TypeDocumentsIndex type="quote" search={sanitizeSearchTerm(q)} />;
}
