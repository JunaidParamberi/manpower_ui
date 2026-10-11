import type { Metadata } from "next";

import { TypeDocumentsIndex } from "@/components/features/documents/type-documents-index";
import { sanitizeSearchTerm } from "@/lib/documents/list-filters";

export const metadata: Metadata = { title: "Purchase orders" };

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PurchaseOrdersPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  return (
    <TypeDocumentsIndex
      type="local_purchase_order"
      search={sanitizeSearchTerm(q)}
    />
  );
}
