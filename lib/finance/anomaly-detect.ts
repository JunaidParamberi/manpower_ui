// lib/finance/anomaly-detect.ts
//
// Deterministic, self-contained anomaly rules for the Finance Analyst
// Agent. Zero imports so this file resolves identically under Node
// (Vitest) and Deno (the finance-analyst Edge Function) without an
// import map.

export type MonthlyMetric = { monthKey: string; value: number };

export type InvoiceAmount = { id: string; clientId: string | null; amount: number };

export type Anomaly = {
  type: "revenue_swing" | "overdue_spike" | "large_invoice";
  severity: "info" | "warning";
  message: string;
  metric: Record<string, number | string>;
};

const SWING_THRESHOLD_PCT = 30;
const LARGE_INVOICE_MULTIPLIER = 2;
const MIN_CLIENT_INVOICES_FOR_BASELINE = 3;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function pctChange(current: number, baseline: number): number | null {
  if (baseline === 0) return null;
  return ((current - baseline) / baseline) * 100;
}

function trailingSwing(
  data: MonthlyMetric[],
): { current: MonthlyMetric; trailingAvg: number; changePct: number } | null {
  if (data.length < 4) return null;
  const sorted = [...data].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  const current = sorted[sorted.length - 1];
  const priorThree = sorted.slice(sorted.length - 4, sorted.length - 1);
  const trailingAvg = priorThree.reduce((sum, m) => sum + m.value, 0) / priorThree.length;
  const changePct = pctChange(current.value, trailingAvg);
  if (changePct === null || Math.abs(changePct) < SWING_THRESHOLD_PCT) return null;
  return { current, trailingAvg, changePct };
}

export function detectRevenueSwing(monthlyRevenue: MonthlyMetric[]): Anomaly | null {
  const swing = trailingSwing(monthlyRevenue);
  if (!swing) return null;
  const direction = swing.changePct > 0 ? "up" : "down";
  return {
    type: "revenue_swing",
    severity: "warning",
    message: `Revenue in ${swing.current.monthKey} is ${direction} ${Math.abs(
      Math.round(swing.changePct),
    )}% vs the trailing 3-month average.`,
    metric: {
      monthKey: swing.current.monthKey,
      current: swing.current.value,
      trailingAvg: round2(swing.trailingAvg),
      changePct: Math.round(swing.changePct),
    },
  };
}

export function detectOverdueSpike(monthlyOverdue: MonthlyMetric[]): Anomaly | null {
  const swing = trailingSwing(monthlyOverdue);
  if (!swing) return null;
  const direction = swing.changePct > 0 ? "up" : "down";
  return {
    type: "overdue_spike",
    severity: "warning",
    message: `Overdue invoices due in ${swing.current.monthKey} are ${direction} ${Math.abs(
      Math.round(swing.changePct),
    )}% vs the trailing 3-month average.`,
    metric: {
      monthKey: swing.current.monthKey,
      current: swing.current.value,
      trailingAvg: round2(swing.trailingAvg),
      changePct: Math.round(swing.changePct),
    },
  };
}

export function detectLargeInvoices(paidInvoices: InvoiceAmount[]): Anomaly[] {
  if (paidInvoices.length === 0) return [];

  const byClient = new Map<string, InvoiceAmount[]>();
  let totalAmount = 0;
  for (const inv of paidInvoices) {
    const key = inv.clientId ?? "__none__";
    const list = byClient.get(key) ?? [];
    list.push(inv);
    byClient.set(key, list);
    totalAmount += inv.amount;
  }

  const anomalies: Anomaly[] = [];
  for (const inv of paidInvoices) {
    const key = inv.clientId ?? "__none__";
    const clientInvoices = byClient.get(key) ?? [];
    const priorClientInvoices = clientInvoices.filter((i) => i.id !== inv.id);

    const otherInvoicesCount = paidInvoices.length - 1;
    const otherInvoicesAvgExcludingCurrent =
      otherInvoicesCount > 0 ? (totalAmount - inv.amount) / otherInvoicesCount : 0;

    const baseline =
      inv.clientId && priorClientInvoices.length >= MIN_CLIENT_INVOICES_FOR_BASELINE
        ? priorClientInvoices.reduce((sum, i) => sum + i.amount, 0) /
          priorClientInvoices.length
        : otherInvoicesAvgExcludingCurrent;

    if (baseline <= 0) continue;
    if (inv.amount > baseline * LARGE_INVOICE_MULTIPLIER) {
      anomalies.push({
        type: "large_invoice",
        severity: "info",
        message: `Invoice ${inv.id} for ${inv.amount} is more than ${LARGE_INVOICE_MULTIPLIER}x the trailing average (${round2(
          baseline,
        )}).`,
        metric: {
          invoiceId: inv.id,
          amount: inv.amount,
          baseline: round2(baseline),
        },
      });
    }
  }
  return anomalies;
}

export function detectAnomalies(input: {
  monthlyRevenue: MonthlyMetric[];
  monthlyOverdue: MonthlyMetric[];
  paidInvoices: InvoiceAmount[];
}): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const revenue = detectRevenueSwing(input.monthlyRevenue);
  if (revenue) anomalies.push(revenue);
  const overdue = detectOverdueSpike(input.monthlyOverdue);
  if (overdue) anomalies.push(overdue);
  anomalies.push(...detectLargeInvoices(input.paidInvoices));
  return anomalies;
}
