import type { SupabaseClient } from "@supabase/supabase-js";

export type UserExportBundle = {
  exportedAt: string;
  userId: string;
  profile: Record<string, unknown> | null;
  brandKit: Record<string, unknown> | null;
  clients: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  lineItems: Record<string, unknown>[];
  services: Record<string, unknown>[];
  recurringInvoices: Record<string, unknown>[];
  recurringInvoiceRuns: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  invoiceAdjustments: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
  timeEntries: Record<string, unknown>[];
  documentTemplates: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  consentLog: Record<string, unknown>[];
};

function asRows<T extends Record<string, unknown>>(data: T[] | null | undefined): T[] {
  return data ?? [];
}

export async function gatherUserData(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserExportBundle> {
  const [
    profileResult,
    brandKitResult,
    clientsResult,
    projectsResult,
    documentsResult,
    servicesResult,
    recurringInvoicesResult,
    recurringRunsResult,
    paymentsResult,
    adjustmentsResult,
    expensesResult,
    timeEntriesResult,
    templatesResult,
    notificationsResult,
    subscriptionsResult,
    consentLogResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("brand_kits").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("clients").select("*").eq("user_id", userId),
    supabase.from("projects").select("*").eq("user_id", userId),
    supabase.from("documents").select("*").eq("user_id", userId),
    supabase.from("services").select("*").eq("user_id", userId),
    supabase.from("recurring_invoices").select("*").eq("user_id", userId),
    supabase.from("recurring_invoice_runs").select("*").eq("user_id", userId),
    supabase.from("payments").select("*").eq("user_id", userId),
    supabase.from("invoice_adjustments").select("*").eq("user_id", userId),
    supabase.from("expenses").select("*").eq("user_id", userId),
    supabase.from("time_entries").select("*").eq("user_id", userId),
    supabase.from("document_templates").select("*").eq("user_id", userId),
    supabase.from("notifications").select("*").eq("user_id", userId),
    supabase.from("subscriptions").select("*").eq("user_id", userId),
    supabase.from("consent_log").select("*").eq("user_id", userId),
  ]);

  const errors = [
    profileResult.error,
    brandKitResult.error,
    clientsResult.error,
    projectsResult.error,
    documentsResult.error,
    servicesResult.error,
    recurringInvoicesResult.error,
    recurringRunsResult.error,
    paymentsResult.error,
    adjustmentsResult.error,
    expensesResult.error,
    timeEntriesResult.error,
    templatesResult.error,
    notificationsResult.error,
    subscriptionsResult.error,
    consentLogResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Failed to gather export data.");
  }

  const projects = asRows(projectsResult.data);
  const documents = asRows(documentsResult.data);
  const projectIds = projects.map((row) => String(row.id));
  const documentIds = documents.map((row) => String(row.id));

  const [tasksResult, lineItemsResult] = await Promise.all([
    projectIds.length > 0
      ? supabase.from("tasks").select("*").in("project_id", projectIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    documentIds.length > 0
      ? supabase.from("line_items").select("*").in("document_id", documentIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
  ]);

  if (tasksResult.error) {
    throw new Error(tasksResult.error.message);
  }
  if (lineItemsResult.error) {
    throw new Error(lineItemsResult.error.message);
  }

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: profileResult.data,
    brandKit: brandKitResult.data,
    clients: asRows(clientsResult.data),
    projects,
    tasks: asRows(tasksResult.data),
    documents,
    lineItems: asRows(lineItemsResult.data),
    services: asRows(servicesResult.data),
    recurringInvoices: asRows(recurringInvoicesResult.data),
    recurringInvoiceRuns: asRows(recurringRunsResult.data),
    payments: asRows(paymentsResult.data),
    invoiceAdjustments: asRows(adjustmentsResult.data),
    expenses: asRows(expensesResult.data),
    timeEntries: asRows(timeEntriesResult.data),
    documentTemplates: asRows(templatesResult.data),
    notifications: asRows(notificationsResult.data),
    subscriptions: asRows(subscriptionsResult.data),
    consentLog: asRows(consentLogResult.data),
  };
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return "";
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header])).join(","),
    ),
  ];

  return lines.join("\n");
}

export function bundleToCsvFiles(
  bundle: UserExportBundle,
): Record<string, string> {
  const files: Record<string, string> = {
    "README.txt":
      "Manpower data export. Each CSV file contains one data type from your workspace.",
  };

  const tables: Array<[string, Record<string, unknown>[] | Record<string, unknown> | null]> = [
    ["profile", bundle.profile ? [bundle.profile] : []],
    ["brand_kit", bundle.brandKit ? [bundle.brandKit] : []],
    ["clients", bundle.clients],
    ["projects", bundle.projects],
    ["tasks", bundle.tasks],
    ["documents", bundle.documents],
    ["line_items", bundle.lineItems],
    ["services", bundle.services],
    ["recurring_invoices", bundle.recurringInvoices],
    ["recurring_invoice_runs", bundle.recurringInvoiceRuns],
    ["payments", bundle.payments],
    ["invoice_adjustments", bundle.invoiceAdjustments],
    ["expenses", bundle.expenses],
    ["time_entries", bundle.timeEntries],
    ["document_templates", bundle.documentTemplates],
    ["notifications", bundle.notifications],
    ["subscriptions", bundle.subscriptions],
    ["consent_log", bundle.consentLog],
  ];

  for (const [name, rows] of tables) {
    const list = Array.isArray(rows) ? rows : [];
    files[`${name}.csv`] = rowsToCsv(list);
  }

  return files;
}

export function summarizeBundle(bundle: UserExportBundle): Array<{
  label: string;
  count: number;
}> {
  return [
    { label: "Clients", count: bundle.clients.length },
    { label: "Projects", count: bundle.projects.length },
    { label: "Tasks", count: bundle.tasks.length },
    { label: "Documents", count: bundle.documents.length },
    { label: "Line items", count: bundle.lineItems.length },
    { label: "Services", count: bundle.services.length },
    { label: "Recurring invoices", count: bundle.recurringInvoices.length },
    { label: "Payments", count: bundle.payments.length },
    { label: "Expenses", count: bundle.expenses.length },
    { label: "Time entries", count: bundle.timeEntries.length },
    { label: "Notifications", count: bundle.notifications.length },
    { label: "Consent log", count: bundle.consentLog.length },
  ];
}
