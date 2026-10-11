import type { RecurringInterval, RecurringLineItemTemplate } from "@/types";

export function formatCadence(
  interval: RecurringInterval,
  intervalCount: number,
): string {
  if (interval === "daily") {
    return intervalCount === 1 ? "Daily" : `Every ${intervalCount} days`;
  }
  if (interval === "weekly") {
    return intervalCount === 1 ? "Weekly" : `Every ${intervalCount} weeks`;
  }
  if (interval === "yearly") {
    return intervalCount === 1 ? "Yearly" : `Every ${intervalCount} years`;
  }
  return intervalCount === 1 ? "Monthly" : `Every ${intervalCount} months`;
}

export function recurringSubtotal(
  lineItems: RecurringLineItemTemplate[],
): number {
  return lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );
}

export const RECURRING_STATUS_LABELS: Record<
  "active" | "paused" | "cancelled",
  string
> = {
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
};
