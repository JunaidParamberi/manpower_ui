import type { Metadata } from "next";

import { listDocumentTemplates } from "@/lib/documents/document-queries";
import { parseNewDocumentParams } from "@/lib/documents/new-document-href";
import { NewDocumentLanding } from "@/components/features/documents/workspace/new-document-landing";

export const metadata: Metadata = {
  title: "New document",
};

type NewDocumentPageProps = {
  searchParams: Promise<{ type?: string; client?: string; projectId?: string; project?: string; templates?: string }>;
};

/** Old links still land here: with a type it creates the draft and moves on, otherwise it asks what to make. */
export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  const sp = await searchParams;
  const params = parseNewDocumentParams(sp);
  const wantTemplates = sp.templates === "1" || !params.type;
  const result = wantTemplates ? await listDocumentTemplates() : null;

  return (
    <NewDocumentLanding
      {...params}
      templates={result?.ok ? result.templates : []}
      openTemplates={sp.templates === "1"}
    />
  );
}
