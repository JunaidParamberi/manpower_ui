import type { Metadata } from "next";

import { TypeDocumentsIndex } from "@/components/features/documents/type-documents-index";
import { sanitizeSearchTerm } from "@/lib/documents/list-filters";

export const metadata: Metadata = { title: "Invoices" };

type PageProps = {
  searchParams: Promise<{ recurring?: string; q?: string }>;
};

export default async function InvoicesPage({ searchParams }: PageProps) {
  const { recurring, q } = await searchParams;
  return (
    <TypeDocumentsIndex
      type="invoice"
      recurringOnly={recurring === "1"}
      search={sanitizeSearchTerm(q)}
    />
  );
}
