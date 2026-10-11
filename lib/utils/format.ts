/** Shared currency display until Phase 2.6 multi-currency. */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** "Oct 13" — date part of an ISO date or timestamp, read as UTC. */
export function formatShortDate(iso: string): string {
  return SHORT_DATE.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}
