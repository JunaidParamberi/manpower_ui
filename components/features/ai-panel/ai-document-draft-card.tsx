"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIThinking } from "@/components/shared/ai-thinking";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { DocumentDraftResult } from "@/lib/ai/document-writer-result";

type AiDocumentDraftCardProps = {
  draft: DocumentDraftResult;
  onCreateDraft: () => void;
  creating: boolean;
};

const DOC_TYPE_LABEL: Record<DocumentDraftResult["docType"], string> = {
  proposal: "Proposal",
  quote: "Quote",
  invoice: "Invoice",
};

function ClientMatchBadge({
  status,
}: {
  status: DocumentDraftResult["clientMatchStatus"];
}) {
  switch (status) {
    case "matched":
      return <Badge variant="accent">Client linked</Badge>;
    case "ambiguous":
      return <Badge variant="warning">Pick a client in the editor</Badge>;
    case "none":
      return <Badge variant="outline">No client — add one in the editor</Badge>;
  }
}

/**
 * Result card for the Document Writer Agent: shows the drafted title, line
 * items, and client-match state, with a primary action to persist the draft
 * as a real document. Purely presentational — no fetching, no streaming.
 */
export function AiDocumentDraftCard({
  draft,
  onCreateDraft,
  creating,
}: AiDocumentDraftCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{draft.title}</h3>
        <Badge variant="secondary">{DOC_TYPE_LABEL[draft.docType]}</Badge>
      </div>

      <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {draft.lineItems.map((item, index) => (
          <div
            key={`${item.description}-${index}`}
            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <span className="text-foreground">{item.description}</span>
            <span className="shrink-0 tabular-nums text-[var(--fg-3)]">
              {item.quantity} × {formatCurrency(item.unitPrice, draft.currency)}
            </span>
          </div>
        ))}
      </div>

      {draft.notes ? (
        <p className="text-xs text-[var(--fg-3)] whitespace-pre-wrap">{draft.notes}</p>
      ) : null}

      <div className="flex items-center justify-between gap-2 pt-1">
        <ClientMatchBadge status={draft.clientMatchStatus} />
        <Button
          size="sm"
          onClick={onCreateDraft}
          disabled={creating}
          className={cn(creating && "gap-2")}
        >
          {creating ? <AIThinking label="Creating" size={13} /> : "Create draft"}
        </Button>
      </div>
    </div>
  );
}
