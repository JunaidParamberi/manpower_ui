// lib/dashboard/snapshot.ts
"use server";

import { unstable_cache } from "next/cache";
import { format, parseISO } from "date-fns";

import { hasNightlyAgents, type PlanTier } from "@/config/plans";
import { calculateInvoiceTotal } from "@/lib/documents/payment-balance";
import {
  currentMonthRange,
  previousPeriodRange,
  rangeCacheKey,
  rangeFromCacheKey,
  revenueRange,
} from "@/lib/finance/date-utils";
import { buildMonthlyRevenueBuckets } from "@/lib/finance/revenue-calc";
import type { RevenueRangeId } from "@/lib/finance/types";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { toHealthSignals } from "@/lib/clients/health-facts";
import { deriveBrief } from "@/lib/dashboard/derive/derive-brief";
import { deriveClients, type LiveHealthInput } from "@/lib/dashboard/derive/derive-clients";
import { deriveMoney } from "@/lib/dashboard/derive/derive-money";
import { deriveQueue } from "@/lib/dashboard/derive/derive-queue";
import { deriveWork } from "@/lib/dashboard/derive/derive-work";
import { extractDocumentEvents, extractProjectEvents, mergeAndSortEvents } from "@/lib/dashboard/activity-utils";
import type { DismissalRow } from "@/lib/dashboard/dismissals";
import type { DashboardSnapshot } from "@/lib/dashboard/snapshot-types";
import type { ActivityEvent } from "@/lib/dashboard/types";

const ACTIVITY_WINDOW_DAYS = 30;
const OPEN_INVOICE_STATUSES = ["sent", "viewed", "partially_paid"];

type DocRow = {
  id: string; type: string; status: string; title: string;
  invoice_number: string | null; quote_number: string | null;
  currency: string | null; discount_value: number | null; discount_type: string | null;
  tax_mode: string | null; tax_rate: number | string | null;
  due_date: string | null; valid_until: string | null;
  created_at: string; updated_at: string;
  sent_at: string | null; paid_at: string | null;
  approved_at: string | null; declined_at: string | null;
  viewed_at: string | null;
  source_document_id: string | null;
  client_id: string | null;
  clients: { id: string; name: string; email: string | null } | null;
  line_items: { quantity: number | string; unit_price: number | string; tax_rate: number | string | null }[] | null;
  payments: { amount: number }[] | null;
  invoice_adjustments: { amount: number; type: string }[] | null;
};

function coerceDiscountType(value: string | null | undefined): "percent" | "flat" {
  return value === "flat" ? "flat" : "percent";
}

function docTotal(row: DocRow): number {
  return calculateInvoiceTotal(
    row.line_items ?? [],
    Number(row.discount_value ?? 0),
    coerceDiscountType(row.discount_type),
    { taxMode: row.tax_mode, taxRate: row.tax_rate },
  );
}

function paidOn(row: DocRow): number {
  return (row.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
}

function writtenOffOn(row: DocRow): number {
  return (row.invoice_adjustments ?? [])
    .filter((a) => a.type === "write_off")
    .reduce((sum, a) => sum + Number(a.amount), 0);
}

/**
 * Quote-to-invoice conversion is tracked by the invoice carrying
 * `source_document_id` = quote id (see `convertQuoteToInvoice`), not by a
 * column on the quote row. A quote counts as converted when a non-voided
 * invoice points back at it.
 */
function convertedFromQuoteIds(docs: DocRow[]): Set<string> {
  return new Set(
    docs
      .filter((d) => d.type === "invoice" && d.status !== "voided" && d.source_document_id)
      .map((d) => d.source_document_id as string),
  );
}

const _cachedSnapshot = unstable_cache(
  async (
    userId: string,
    planTier: PlanTier,
    monthFromDay: string,
    monthToDay: string,
    revenueFromDay: string,
    revenueToDay: string,
  ): Promise<DashboardSnapshot> => {
    const { supabase } = await getServerContext();
    const now = new Date();
    const nowIso = now.toISOString();
    const month = rangeFromCacheKey(monthFromDay, monthToDay);
    const previousMonth = previousPeriodRange(month);
    const revenueWindow = rangeFromCacheKey(revenueFromDay, revenueToDay);
    const activitySince = new Date(now.getTime() - ACTIVITY_WINDOW_DAYS * 86_400_000).toISOString();
    const nightly = hasNightlyAgents(planTier);

    // ---- Round trip 1: every document the dashboard can care about --------
    const documentsPromise = supabase
      .from("documents")
      .select(
        "id, type, status, title, invoice_number, quote_number, currency, discount_value, discount_type, tax_mode, tax_rate, due_date, valid_until, created_at, updated_at, sent_at, paid_at, approved_at, declined_at, viewed_at, source_document_id, client_id, clients:client_id(id, name, email), line_items(quantity, unit_price, tax_rate), payments!payments_document_id_fkey(amount), invoice_adjustments(amount, type)",
      )
      .eq("user_id", userId)
      .or(
        `status.in.(draft,sent,viewed,partially_paid,approved),updated_at.gte.${activitySince}`,
      )
      .order("updated_at", { ascending: false })
      .limit(300);

    // ---- Round trip 2: payments for the money row and the chart ----------
    const paymentsPromise = supabase
      .from("payments")
      .select("amount, currency, paid_at")
      .eq("user_id", userId)
      .gte("paid_at", previousMonth.from.toISOString());

    const revenuePaymentsPromise = supabase
      .from("payments")
      .select("amount, currency, paid_at")
      .eq("user_id", userId)
      .gte("paid_at", revenueWindow.from.toISOString())
      .lte("paid_at", revenueWindow.to.toISOString());

    // ---- Round trip 3: work, agents, profile, dismissals -----------------
    const projectsPromise = supabase
      .from("projects")
      .select(
        "id, title, status, deadline, budget, spent, updated_at, client_id, clients:client_id(id, name, email), expenses(amount), tasks(id, title, status, due_date)",
      )
      .eq("user_id", userId);

    const profilePromise = supabase
      .from("profiles")
      .select("default_currency")
      .eq("id", userId)
      .maybeSingle();

    const dismissalsPromise = supabase
      .from("dashboard_dismissals")
      .select("item_type, item_id, snoozed_until, dismissed_at")
      .eq("user_id", userId);

    const clientsPromise = supabase
      .from("clients")
      .select("id, name, relationship_status, payment_terms_days, created_at")
      .eq("user_id", userId);

    const digestPromise = nightly
      ? supabase
          .from("project_digests")
          .select("id, digest_date, facts, narrative, actions, created_at")
          .eq("user_id", userId)
          .order("digest_date", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null });

    const followUpsPromise = nightly
      ? supabase
          .from("follow_ups")
          .select("id, trigger_type, subject_type, subject_id, client_id, rung, clients(name, email)")
          .eq("user_id", userId)
          .eq("status", "pending")
      : Promise.resolve({ data: [] });

    const healthPromise = nightly
      ? supabase
          .from("client_health_snapshots")
          .select("client_id, score, band, signals, snapshot_date, clients(name)")
          .eq("user_id", userId)
          .order("snapshot_date", { ascending: false })
      : Promise.resolve({ data: [] });

    const [
      documentsRes,
      paymentsRes,
      revenuePaymentsRes,
      projectsRes,
      profileRes,
      dismissalsRes,
      clientsRes,
      digestRes,
      followUpsRes,
      healthRes,
    ] = await Promise.all([
      documentsPromise,
      paymentsPromise,
      revenuePaymentsPromise,
      projectsPromise,
      profilePromise,
      dismissalsPromise,
      clientsPromise,
      digestPromise,
      followUpsPromise,
      healthPromise,
    ]);

    const docs = (documentsRes.data ?? []) as unknown as DocRow[];
    const profileCurrency = profileRes.data?.default_currency?.trim() || "USD";

    // ---- Money ------------------------------------------------------------
    const allPayments = (paymentsRes.data ?? []) as { amount: number; currency: string; paid_at: string }[];
    // PostgREST serializes timestamptz as "2026-09-13 09:00:00+00" while
    // toISOString() yields "2026-09-13T09:00:00.000Z", so compare instants,
    // not strings — same fix as the dismissals snooze comparison.
    const inMonth = (paidAt: string) =>
      Date.parse(paidAt) >= month.from.getTime() && Date.parse(paidAt) <= month.to.getTime();

    const money = deriveMoney({
      baseCurrency: profileCurrency,
      payments: allPayments.filter((p) => inMonth(p.paid_at)).map((p) => ({ amount: Number(p.amount), currency: p.currency })),
      previousPayments: allPayments
        .filter((p) => Date.parse(p.paid_at) >= previousMonth.from.getTime() && Date.parse(p.paid_at) < month.from.getTime())
        .map((p) => ({ amount: Number(p.amount), currency: p.currency })),
      openInvoices: docs
        .filter((d) => d.type === "invoice" && OPEN_INVOICE_STATUSES.includes(d.status))
        .map((d) => ({
          total: docTotal(d),
          paid: paidOn(d),
          writtenOff: writtenOffOn(d),
          currency: d.currency ?? profileCurrency,
          dueDate: d.due_date,
        })),
      paidInvoices: docs
        .filter((d) => d.type === "invoice" && d.status === "paid" && d.paid_at && inMonth(d.paid_at))
        .map((d) => ({ sent_at: d.sent_at, paid_at: d.paid_at })),
      now,
    });

    // ---- Revenue chart ----------------------------------------------------
    const currentMonthKey = format(now, "yyyy-MM");
    const revenue = buildMonthlyRevenueBuckets(
      ((revenuePaymentsRes.data ?? []) as { amount: number; currency: string; paid_at: string }[])
        .filter((p) => p.currency === money.primaryCurrency)
        .map((p) => ({ amount: Number(p.amount), paid_at: p.paid_at })),
      currentMonthKey,
    ).map(({ monthKey, revenue: amount }) => ({
      monthKey,
      month: format(parseISO(`${monthKey}-01`), "MMM yyyy"),
      revenue: amount,
      isCurrent: monthKey === currentMonthKey,
    }));

    // ---- Queue ------------------------------------------------------------
    const projects = (projectsRes.data ?? []) as unknown as {
      id: string; title: string; status: string; deadline: string | null;
      budget: number | null; spent: number | null; updated_at: string;
      clients: { id: string; name: string; email: string | null } | null;
      expenses: { amount: number }[] | null;
      tasks: { id: string; title: string; status: string; due_date: string | null }[] | null;
    }[];

    const dismissals: DismissalRow[] = ((dismissalsRes.data ?? []) as {
      item_type: string; item_id: string; snoozed_until: string | null; dismissed_at: string | null;
    }[]).map((row) => ({
      itemType: row.item_type,
      itemId: row.item_id,
      snoozedUntil: row.snoozed_until,
      dismissedAt: row.dismissed_at,
    }));

    const convertedFromQuote = convertedFromQuoteIds(docs);

    const { items: queue, snoozedCount } = deriveQueue({
      nowIso,
      invoices: docs
        .filter((d) => d.type === "invoice")
        .map((d) => ({
          id: d.id, number: d.invoice_number, dueDate: d.due_date, status: d.status,
          currency: d.currency ?? profileCurrency,
          total: docTotal(d), paid: paidOn(d), writtenOff: writtenOffOn(d),
          clientId: d.clients?.id ?? null, clientName: d.clients?.name ?? null, clientEmail: d.clients?.email ?? null,
        })),
      quotes: docs
        .filter((d) => d.type === "quote")
        .map((d) => ({
          id: d.id, number: d.quote_number, status: d.status, sentAt: d.sent_at,
          validUntil: d.valid_until, approvedAt: d.approved_at,
          convertedInvoiceId: convertedFromQuote.has(d.id) ? d.id : null,
          currency: d.currency ?? profileCurrency, total: docTotal(d),
          clientId: d.clients?.id ?? null, clientName: d.clients?.name ?? null, clientEmail: d.clients?.email ?? null,
        })),
      drafts: docs
        .filter((d) => d.status === "draft")
        .map((d) => ({
          id: d.id, title: d.title, type: d.type, createdAt: d.created_at,
          currency: d.currency ?? profileCurrency, total: docTotal(d),
          clientId: d.clients?.id ?? null, clientName: d.clients?.name ?? null, clientEmail: d.clients?.email ?? null,
        })),
      projects: projects.map((p) => ({
        id: p.id, title: p.title, deadline: p.deadline, status: p.status,
        clientId: p.clients?.id ?? null, clientName: p.clients?.name ?? null, clientEmail: p.clients?.email ?? null,
      })),
      tasks: projects.flatMap((p) =>
        (p.tasks ?? []).map((t) => ({
          id: t.id, title: t.title, dueDate: t.due_date, status: t.status,
          projectId: p.id, projectTitle: p.title,
          clientId: p.clients?.id ?? null, clientName: p.clients?.name ?? null, clientEmail: p.clients?.email ?? null,
        })),
      ),
      followUps: ((followUpsRes.data ?? []) as unknown as {
        id: string; trigger_type: string; subject_type: "document" | "project";
        subject_id: string; client_id: string | null; rung: number;
        clients: { name: string; email: string | null } | null;
      }[]).map((f) => ({
        id: f.id, subjectId: f.subject_id, subjectType: f.subject_type,
        triggerType: f.trigger_type, rung: f.rung, tone: "firm",
        clientId: f.client_id, clientName: f.clients?.name ?? null, clientEmail: f.clients?.email ?? null,
      })),
      dismissals,
    });

    // ---- Activity ---------------------------------------------------------
    const activity: ActivityEvent[] = mergeAndSortEvents(
      [
        ...docs
          .filter((d) => d.updated_at >= activitySince)
          .flatMap((d) =>
            extractDocumentEvents({
              id: d.id, type: d.type as never, sent_at: d.sent_at, paid_at: d.paid_at,
              approved_at: d.approved_at, declined_at: d.declined_at,
              invoice_number: d.invoice_number, quote_number: d.quote_number,
              title: d.title, clientName: d.clients?.name ?? null,
              amount: docTotal(d), currency: d.currency,
            }),
          ),
        ...projects
          .filter((p) => p.updated_at >= activitySince)
          .flatMap((p) =>
            extractProjectEvents({
              id: p.id, title: p.title, status: p.status,
              updated_at: p.updated_at, clientName: p.clients?.name ?? null,
            }),
          ),
      ],
      10,
    );

    // ---- Work -------------------------------------------------------------
    const work = deriveWork({
      nowIso,
      projects: projects.map((p) => ({
        id: p.id, title: p.title, status: p.status, deadline: p.deadline,
        budget: p.budget, spent: p.spent,
        expenseTotal: (p.expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0),
        clientName: p.clients?.name ?? null,
      })),
      documents: docs.map((d) => ({
        id: d.id, title: d.title, type: d.type, status: d.status,
        createdAt: d.created_at, sentAt: d.sent_at, approvedAt: d.approved_at,
        convertedInvoiceId: d.source_document_id,
        total: docTotal(d), currency: d.currency ?? profileCurrency,
        clientName: d.clients?.name ?? null,
      })),
    });

    // ---- Brief ------------------------------------------------------------
    const digestRow = digestRes.data as
      | { id: string; digest_date: string; facts: unknown; narrative: string | null; actions: unknown; created_at: string }
      | null;

    const brief = deriveBrief({
      digest: digestRow
        ? {
            id: digestRow.id,
            digestDate: digestRow.digest_date,
            facts: digestRow.facts as never,
            narrative: digestRow.narrative,
            actions: (digestRow.actions ?? []) as never,
            createdAt: digestRow.created_at,
          }
        : null,
      queue,
      money,
      hasNightlyAgents: nightly,
    });

    // ---- Clients ----------------------------------------------------------
    const healthRows = (healthRes.data ?? []) as unknown as {
      client_id: string; score: number; band: string; signals: unknown;
      snapshot_date: string; clients: { name: string } | null;
    }[];

    const latestByClient = new Map<string, (typeof healthRows)[number]>();
    for (const row of healthRows) {
      if (!latestByClient.has(row.client_id)) latestByClient.set(row.client_id, row);
    }

    const clientRows = (clientsRes.data ?? []) as unknown as {
      id: string; name: string; relationship_status: string;
      payment_terms_days: number | null; created_at: string;
    }[];

    const liveInputs: LiveHealthInput[] = clientRows.map((client) => {
      const clientDocs = docs.filter((d) => d.client_id === client.id);
      return {
        client: {
          id: client.id,
          name: client.name,
          relationshipStatus: client.relationship_status,
          paymentTermsDays: client.payment_terms_days ?? 30,
          createdAt: client.created_at,
        } as LiveHealthInput["client"],
        invoices: clientDocs
          .filter((d) => d.type === "invoice")
          .map((d) => ({
            id: d.id, status: d.status, dueDate: d.due_date,
            sentAt: d.sent_at, paidAt: d.paid_at, total: docTotal(d),
            daysToPay:
              d.paid_at && d.sent_at
                ? Math.round((Date.parse(d.paid_at) - Date.parse(d.sent_at)) / 86_400_000)
                : null,
          })) as LiveHealthInput["invoices"],
        documents: clientDocs.map((d) => ({
          id: d.id, sentAt: d.sent_at, viewedAt: d.viewed_at, type: d.type, status: d.status,
        })) as LiveHealthInput["documents"],
        projects: projects
          .filter((p) => p.clients?.id === client.id)
          .map((p) => ({ id: p.id, status: p.status, updatedAt: p.updated_at })) as LiveHealthInput["projects"],
        revenueLast90: 0,
        revenuePrior90: 0,
      };
    });

    const clients = deriveClients({
      nowIso,
      snapshots: [...latestByClient.values()].map((row) => ({
        clientId: row.client_id,
        clientName: row.clients?.name ?? "Client",
        score: row.score,
        band: row.band as never,
        topSignal: toHealthSignals(row.signals)[0] ?? null,
      })),
      liveInputs,
    });

    return {
      currency: money.primaryCurrency,
      profileCurrency,
      money,
      queue,
      snoozedCount,
      revenue,
      activity,
      work,
      brief,
      clients,
    };
  },
  ["dashboard-snapshot"],
  { revalidate: 60, tags: ["dashboard", "finance"] },
);

export async function getDashboardSnapshot(args: {
  revenueRange: RevenueRangeId;
  planTier: PlanTier;
}): Promise<DashboardSnapshot> {
  const { user } = await getServerContext();
  if (!user) throw new Error("getDashboardSnapshot called without a session");

  const month = rangeCacheKey(currentMonthRange());
  const revenueKey = rangeCacheKey(revenueRange(args.revenueRange));

  return _cachedSnapshot(
    user.id,
    args.planTier,
    month.fromDay,
    month.toDay,
    revenueKey.fromDay,
    revenueKey.toDay,
  );
}