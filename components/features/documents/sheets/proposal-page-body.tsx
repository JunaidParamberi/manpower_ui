"use client";

import type { TiptapDoc } from "@/types";
import { DocumentPageBody } from "./document-page-body";
import { TiptapContentRenderer } from "./tiptap-content-renderer";

type ProposalPageBodyProps = {
  proposalNumber: string | null;
  clientName?: string | null;
  projectName?: string | null;
  contentJson: TiptapDoc | null;
  /** Number of pages before these content pages (e.g. 1 for cover page) */
  precedingPages?: number;
  onPageCountChange?: (n: number) => void;
};

export function ProposalPageBody({
  proposalNumber,
  clientName,
  projectName,
  contentJson,
  precedingPages = 1,
  onPageCountChange,
}: ProposalPageBodyProps) {
  const label = [
    proposalNumber ? `Proposal ${proposalNumber}` : "Proposal",
    clientName ? `· ${clientName}` : "",
    projectName ? `— ${projectName}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DocumentPageBody
      headerSlot={
        <div className="proposal-page-band">
          <span>{label}</span>
        </div>
      }
      startPage={precedingPages + 1}
      onPageCountChange={onPageCountChange}
    >
      <TiptapContentRenderer doc={contentJson} />
    </DocumentPageBody>
  );
}
