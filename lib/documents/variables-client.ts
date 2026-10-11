import type { ClientRow, ProjectListRow } from "@/types";
import type { VariableContext } from "./variables";

export function buildClientSideContext({
  clientId,
  projectId,
  clients,
  projects,
  initialCtx,
}: {
  clientId: string | undefined;
  projectId: string | undefined;
  clients: ClientRow[];
  projects: ProjectListRow[];
  initialCtx: VariableContext;
}): VariableContext {
  const client = clientId
    ? (clients.find((c) => c.id === clientId) ?? null)
    : null;

  const project = projectId
    ? (projects.find((p) => p.id === projectId) ?? null)
    : null;

  return {
    brand: initialCtx.brand,
    sender: initialCtx.sender,
    now: new Date(),
    client: client
      ? {
          name: client.name,
          contact_name: client.contact_name,
          email: client.email,
          billing_email: client.billing_email,
          company: client.company,
          phone: client.phone ?? null,
          address: client.address ?? null,
          website: client.website ?? null,
          tax_id: client.tax_id ?? null,
          payment_terms_days:
            client.payment_terms_days === null
              ? null
              : String(client.payment_terms_days),
        }
      : null,
    project: project ? { title: project.title } : null,
  };
}
