"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ReactNode } from "react";

import { DownloadPdfButton } from "@/components/features/documents/download-pdf-button";
import { VoidDocumentButton } from "@/components/features/documents/void-document-button";
import { Button } from "@/components/ui/button";

type DocumentDetailHeaderActionsProps = {
  documentId: string;
  pdfFilename: string;
  documentStatus: string;
  isVoided: boolean;
  isSettled?: boolean;
  showEdit?: boolean;
  sendButton?: ReactNode;
  extraActions?: ReactNode;
};

export function DocumentDetailHeaderActions({
  documentId,
  pdfFilename,
  documentStatus,
  isVoided,
  isSettled = false,
  showEdit = true,
  sendButton,
  extraActions,
}: DocumentDetailHeaderActionsProps) {
  const canMutate = !isVoided && !isSettled;

  return (
    <>
      <DownloadPdfButton documentId={documentId} filename={pdfFilename} />
      {showEdit && canMutate ? (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/documents/${documentId}/edit`} />}
        >
          <Pencil />
          <span className="hidden sm:inline">Edit document</span>
        </Button>
      ) : null}
      {canMutate ? sendButton : null}
      {extraActions}
      {canMutate ? (
        <VoidDocumentButton documentId={documentId} documentStatus={documentStatus} />
      ) : null}
    </>
  );
}
