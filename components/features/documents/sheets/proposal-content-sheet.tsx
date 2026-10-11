import type { VariableContext } from "@/lib/documents/variables";
import type { TiptapDoc } from "@/types";
import { ProposalPageBody } from "./proposal-page-body";

type ProposalContentSheetProps = {
  variableContext: VariableContext;
  proposalNumber: string | null;
  clientName?: string | null;
  projectName?: string | null;
  contentJson: TiptapDoc | null;
};

export function ProposalContentSheet({
  variableContext: _variableContext,
  proposalNumber,
  clientName,
  projectName,
  contentJson,
}: ProposalContentSheetProps) {
  return (
    <ProposalPageBody
      proposalNumber={proposalNumber}
      clientName={clientName}
      projectName={projectName}
      contentJson={contentJson}
      precedingPages={1}
    />
  );
}
