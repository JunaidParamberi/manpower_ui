import type { Metadata } from "next";

import { getDocumentById } from "@/lib/documents/document-queries";
import { DocumentDetail } from "@/components/features/documents/document-detail";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; view?: string; fresh?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const document = await getDocumentById(id);
  return { title: document?.title ?? "Document" };
}

export default async function DocumentDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  return <DocumentDetail id={id} wantEdit={sp.edit === "1"} wantRead={sp.view === "1"} fresh={sp.fresh === "1"} />;
}
