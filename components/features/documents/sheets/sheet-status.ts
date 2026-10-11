export type SheetStatusVariant = "default" | "success" | "warn" | "accent";

export type SheetStatus = { label: string; variant: SheetStatusVariant };

/** Status pill shown on the invoice sheet and the invoice PDF. */
export function toInvoiceSheetStatus(status: string | null): SheetStatus {
  switch (status) {
    case "paid": return { label: "Paid", variant: "success" };
    case "overdue": return { label: "Overdue", variant: "warn" };
    case "sent": return { label: "Sent · awaiting payment", variant: "accent" };
    case "partially_paid": return { label: "Partially paid", variant: "warn" };
    default: return { label: status ?? "Draft", variant: "default" };
  }
}

/** Status pill shown on the quote sheet and the quote PDF. */
export function toQuoteSheetStatus(status: string | null): SheetStatus {
  return { label: status ?? "Draft", variant: "default" };
}

/** Status pill shown on the LPO sheet and the LPO PDF. */
export function toLpoSheetStatus(status: string | null): SheetStatus {
  switch (status) {
    case "approved":
      return { label: "Authorised · received in Manpower", variant: "accent" };
    case "sent":
    case "viewed":
      return { label: "Authorised · awaiting acknowledgement", variant: "accent" };
    case "archived":
      return { label: "Archived", variant: "default" };
    default:
      return { label: "Draft", variant: "default" };
  }
}
