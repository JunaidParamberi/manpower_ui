type SendResult = {
  ok: boolean;
  error?: string;
};

/**
 * Frontend-only build: transactional emails are not dispatched. Callers
 * keep the same result contract (`{ ok }` / `{ ok: false, error }`).
 */
export function sendDocumentEventEmail(input: {
  to: string;
  event:
    | "invoice_paid"
    | "quote_approved"
    | "proposal_approved"
    | "quote_declined"
    | "doc_sent"
    | "quote_viewed";
  documentNumber: string;
  clientName: string;
  documentUrl: string;
  amount?: number | null;
  currency?: string;
}): Promise<SendResult> {
  console.log("[mock-email] sendDocumentEventEmail", {
    to: input.to,
    event: input.event,
    documentNumber: input.documentNumber,
    documentUrl: input.documentUrl,
  });
  return Promise.resolve({ ok: true });
}
