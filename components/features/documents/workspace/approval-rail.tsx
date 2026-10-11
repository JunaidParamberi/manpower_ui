"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, FileText, ShoppingBag, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createLpoDraftFromQuote } from "@/lib/documents/lpo-mutations";
import { convertProposalToInvoice } from "@/lib/documents/proposal-mutations";
import { convertQuoteToInvoice } from "@/lib/documents/quote-mutations";
import { ConvertProposalToProjectButton } from "../convert-proposal-to-project-button";
import type { DocumentStatus } from "@/types";
import { CopyLinkRow } from "./copy-link-row";
import { RailSection } from "./rail/rail-section";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Where a sent quote or proposal stands with the client, and what to do once it is approved. */
export function ApprovalRail({
  documentId, kind, status, approvedAt, declinedAt, approvalMessage, approvalUrl, clientId = null, hasProject = false,
}: {
  documentId: string;
  kind: "quote" | "proposal";
  status: DocumentStatus;
  approvedAt: string | null;
  declinedAt: string | null;
  approvalMessage: string | null;
  approvalUrl: string | null;
  /** Proposals: the client and whether a project already exists, for "Convert to project". */
  clientId?: string | null;
  hasProject?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string; invoiceId?: string; lpoId?: string; alreadyConverted?: boolean; alreadyCreated?: boolean }>, done: string) {
    setError(null);
    start(async () => {
      const r = await action();
      const target = r.invoiceId ?? r.lpoId;
      if (r.ok && target) {
        toast.success(done);
        router.push(`/documents/${target}`);
      } else {
        const message = r.error ?? "Couldn't complete that. Try again.";
        setError(message);
        toast.error(message);
      }
    });
  }

  let state: React.ReactNode = null;
  if (status === "approved") {
    state = (
      <div className="flex items-center gap-2 px-2 py-1 text-[13px] font-medium text-[var(--success)]">
        <CheckCircle2 className="size-4 shrink-0" />
        Approved{approvedAt ? ` on ${fmt(approvedAt)}` : ""}
      </div>
    );
  } else if (status === "declined") {
    state = (
      <div className="flex items-center gap-2 px-2 py-1 text-[13px] font-medium text-[var(--danger)]">
        <XCircle className="size-4 shrink-0" />
        Declined{declinedAt ? ` on ${fmt(declinedAt)}` : ""}
      </div>
    );
  } else if (approvalUrl) {
    state = (
      <>
        <div className="flex items-center gap-2 px-2 py-1 text-[13px] text-[var(--fg-2)]">
          <Clock className="size-4 shrink-0 text-[var(--fg-3)]" />
          Waiting for the client
        </div>
        <CopyLinkRow label="Approval link" url={approvalUrl} />
      </>
    );
  }
  if (!state) return null;

  return (
    <RailSection title="Approval">
      {state}
      {approvalMessage ? <p className="px-2 py-1 text-[12px] text-[var(--fg-2)] italic">&ldquo;{approvalMessage}&rdquo;</p> : null}
      {kind === "proposal" && status === "approved" ? (
        <div className="mt-1.5 flex flex-col gap-1.5 px-2">
          <Button size="sm" disabled={pending} onClick={() => run(() => convertProposalToInvoice(documentId), "Invoice created")}>
            <FileText className="size-3.5" />
            {pending ? "Working…" : "Convert to invoice"}
          </Button>
          {clientId && !hasProject ? <ConvertProposalToProjectButton documentId={documentId} clientId={clientId} /> : null}
          {error ? <p role="alert" className="text-[12px] text-[var(--danger)]">{error}</p> : null}
        </div>
      ) : null}
      {kind === "quote" && status === "approved" ? (
        <div className="mt-1.5 flex flex-col gap-1.5 px-2">
          <Button size="sm" disabled={pending} onClick={() => run(() => convertQuoteToInvoice(documentId), "Converted to invoice")}>
            <FileText className="size-3.5" />
            {pending ? "Working…" : "Convert to invoice"}
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => createLpoDraftFromQuote(documentId), "LPO draft ready")}>
            <ShoppingBag className="size-3.5" />
            Convert to LPO
          </Button>
          {error ? <p role="alert" className="text-[12px] text-[var(--danger)]">{error}</p> : null}
        </div>
      ) : null}
    </RailSection>
  );
}
