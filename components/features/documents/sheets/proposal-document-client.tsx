"use client";

import { useCallback, useState } from "react";
import type { VariableContext } from "@/lib/documents/variables";
import type { TiptapDoc } from "@/types";
import { ProposalCoverSheet } from "./proposal-cover-sheet";
import { ProposalPageBody } from "./proposal-page-body";
import { formatSheetDate } from "./types";

type ProposalDocumentClientProps = {
  variableContext: VariableContext;
  proposalNumber: string;
  version: number | null;
  headline: string;
  headlineAccent: string | null;
  subhead: string | null;
  investmentRange: string | null;
  clientName: string | null;
  projectName: string | null;
  preparedByName: string | null;
  issuedDate: string;
  contentJson: TiptapDoc | null;
};

export function ProposalDocumentClient({
  variableContext,
  proposalNumber,
  version,
  headline,
  headlineAccent,
  subhead,
  investmentRange,
  clientName,
  projectName,
  preparedByName,
  issuedDate,
  contentJson,
}: ProposalDocumentClientProps) {
  // Start with 2 (cover + 1 content). Updates when ProposalPageBody measures.
  const [totalPages, setTotalPages] = useState(2);

  const handlePageCountChange = useCallback((contentPageCount: number) => {
    setTotalPages(1 + contentPageCount);
  }, []);

  return (
    <div>
      <ProposalCoverSheet
        variableContext={variableContext}
        proposalNumber={proposalNumber}
        version={version}
        headline={headline}
        headlineAccent={headlineAccent}
        subhead={subhead}
        clientName={clientName}
        projectName={projectName}
        investmentRange={investmentRange}
        preparedByName={preparedByName}
        issuedDate={issuedDate}
        totalPages={totalPages}
      />
      <ProposalPageBody
        proposalNumber={proposalNumber}
        clientName={clientName}
        projectName={projectName}
        contentJson={contentJson}
        precedingPages={1}
        onPageCountChange={handlePageCountChange}
      />
    </div>
  );
}
