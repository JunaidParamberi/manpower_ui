export type BillableEntry = {
  id: string;
  description: string | null;
  durationSeconds: number | null;
  billed: boolean;
  project: {
    id: string;
    title: string;
    clientId: string | null;
    hourlyRate: number | null;
  } | null;
};

export type LineItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  sort_order: number;
};

export type SelectionSummary = {
  count: number;
  totalHours: number;
  estTotal: number;
  clientId: string | null;
  mixed: boolean;
};

export type SelectionError = "empty" | "mixed_client" | "already_billed" | "no_client";

/** Convert tracked seconds to billable hours, rounded to 2 decimal places. */
export function secondsToBillableHours(seconds: number | null): number {
  if (!seconds || seconds <= 0) return 0;
  return Math.round((seconds / 3600) * 100) / 100;
}

/** Validate a selection is a single client, unbilled, and has a client. */
export function validateBillingSelection(
  entries: BillableEntry[],
): { ok: true } | { ok: false; error: SelectionError } {
  if (entries.length === 0) return { ok: false, error: "empty" };
  if (entries.some((e) => e.billed)) return { ok: false, error: "already_billed" };
  if (entries.some((e) => !e.project || !e.project.clientId))
    return { ok: false, error: "no_client" };
  const clientIds = new Set(entries.map((e) => e.project!.clientId));
  if (clientIds.size > 1) return { ok: false, error: "mixed_client" };
  return { ok: true };
}

/** Map each entry to an invoice line item (hours × project rate). */
export function buildLineItemsFromEntries(entries: BillableEntry[]): LineItemInput[] {
  return entries.map((e, index) => ({
    description: e.description?.trim() || e.project?.title || "",
    quantity: secondsToBillableHours(e.durationSeconds),
    unit_price: e.project?.hourlyRate ?? 0,
    tax_rate: 0,
    sort_order: index,
  }));
}

/** Summarize a selection for the action bar. */
export function summarizeSelection(entries: BillableEntry[]): SelectionSummary {
  const clientIds = new Set(
    entries.map((e) => e.project?.clientId).filter((id): id is string => Boolean(id)),
  );
  const totalHours =
    Math.round(
      entries.reduce((sum, e) => sum + secondsToBillableHours(e.durationSeconds), 0) * 100,
    ) / 100;
  const estTotal =
    Math.round(
      entries.reduce(
        (sum, e) =>
          sum + secondsToBillableHours(e.durationSeconds) * (e.project?.hourlyRate ?? 0),
        0,
      ) * 100,
    ) / 100;
  const mixed = clientIds.size > 1;
  return {
    count: entries.length,
    totalHours,
    estTotal,
    clientId: !mixed && clientIds.size === 1 ? [...clientIds][0] : null,
    mixed,
  };
}
