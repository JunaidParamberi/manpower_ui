// Storybook stand-in for lib/documents/invoice-mutations (server actions).
const ok = async () => ({ ok: true });

export const upsertLineItem = async (_documentId: string, input: { id?: string }) => ({
  ok: true,
  lineItem: { id: input.id ?? `line-${Math.random().toString(36).slice(2, 8)}` },
});
export const deleteLineItem = ok;
export const reorderLineItems = ok;
export const updateInvoiceMeta = ok;
export const recordInvoicePayment = ok;
export const markInvoicePaid = recordInvoicePayment;
