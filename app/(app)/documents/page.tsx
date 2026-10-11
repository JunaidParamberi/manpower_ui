import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { listDocuments } from "@/lib/documents/document-queries";
import { DocumentDetail } from "@/components/features/documents/document-detail";
import { NewDocumentButton } from "@/components/features/documents/workspace/new-document-button";
import { sanitizeSearchTerm } from "@/lib/documents/list-filters";

export const metadata: Metadata = {
  title: "Documents",
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DocumentsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const result = await listDocuments({ search: sanitizeSearchTerm(q) });
  const documents = result.ok ? result.documents : [];

  if (documents.length > 0) {
    return <DocumentDetail id={documents[0].id} />;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <FileText className="size-10 text-muted-foreground/40" />
      <div>
        <p className="text-sm font-medium text-foreground">No documents yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first document. It opens ready to fill in.
        </p>
      </div>
      <NewDocumentButton contextType="invoice" size="default" />
      <p className="max-w-sm text-xs text-muted-foreground">
        Or press{" "}
        <kbd className="rounded-xs border border-border bg-[var(--bg-surface)] px-[5px] py-px font-sans text-[10.5px] text-[var(--fg-3)]">
          ⌘J
        </kbd>{" "}
        and ask the assistant to draft one for you.
      </p>
    </div>
  );
}
