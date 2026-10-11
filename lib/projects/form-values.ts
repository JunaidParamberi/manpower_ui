import type { ProjectCreateFormInput } from "@/lib/validations/project";
import type { ProjectPlanDraft } from "@/lib/projects/proposal-to-project";
import type { ClientRow, ProjectListRow } from "@/types";

export function projectCreateDefaultsForClient({
  clients,
  requestedClientId,
}: {
  clients: ClientRow[];
  requestedClientId?: string | null;
}): ProjectCreateFormInput {
  const requestedClient = requestedClientId
    ? clients.find((client) => client.id === requestedClientId)
    : null;

  return {
    client_id: requestedClient?.id ?? clients[0]?.id ?? "",
    title: "",
    status: "planning",
    budget: "",
    spent: "",
    hourly_rate: "",
    start_date: "",
    deadline: "",
  };
}

function moneyToFormField(n: number | null): string {
  if (n === null || n === undefined) {
    return "";
  }
  return String(n);
}

/** Map a persisted project to react-hook-form defaults for create/edit. */
export function projectRowToFormValues(row: ProjectListRow): ProjectCreateFormInput {
  return {
    client_id: row.client_id,
    title: row.title,
    status: row.status,
    budget: moneyToFormField(row.budget),
    spent: moneyToFormField(row.spent),
    hourly_rate: moneyToFormField(row.hourly_rate),
    start_date: row.start_date ?? "",
    deadline: row.deadline ?? "",
  };
}

export function projectCreateDefaultsFromPlanDraft({
  clients,
  requestedClientId,
  planDraft,
}: {
  clients: ClientRow[];
  requestedClientId?: string | null;
  planDraft: ProjectPlanDraft;
}): ProjectCreateFormInput {
  const base = projectCreateDefaultsForClient({ clients, requestedClientId });
  return {
    ...base,
    title: planDraft.title,
  };
}
