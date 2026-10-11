"use client";

import type { ClientRow, ProjectListRow } from "@/types";
import { SUPPORTED_CURRENCIES } from "@/lib/data/currencies";
import { PaperField } from "./paper/paper-field";
import { RailField } from "./rail/rail-field";
import { RailPicker } from "./rail/rail-picker";
import { Code, Dot, Tile } from "./token-parts";

type Side = "left" | "bottom";

const clientOptions = (clients: ClientRow[]) =>
  clients.map((c) => ({
    value: c.id,
    label: c.company ?? c.name,
    secondary: c.contact_name ?? c.email ?? undefined,
    leading: <Tile id={c.id} label={c.name} />,
    trailing: c.currency ? <Code>{c.currency}</Code> : undefined,
    keywords: c.email ?? "",
  }));

/** Client row for the rail. */
export function ClientRailField({
  clients, clientId, disabled, side, onPick, onNew,
}: {
  clients: ClientRow[];
  clientId: string | null;
  disabled: boolean;
  side: Side;
  onPick: (clientId: string) => void;
  onNew: () => void;
}) {
  const client = clients.find((c) => c.id === clientId) ?? null;
  return (
    <RailPicker
      side={side}
      placeholder="Search clients"
      value={clientId}
      footerAction={{ label: (q) => (q ? `New client "${q}"` : "New client"), onSelect: onNew }}
      onPick={onPick}
      options={clientOptions(clients)}
      trigger={
        <RailField label="Client" disabled={disabled}>
          {client ? (
            <>
              <Tile id={client.id} label={client.name} />
              <span className="truncate">{client.company ?? client.name}</span>
            </>
          ) : (
            <span className="font-normal text-[var(--fg-3)]">Choose a client</span>
          )}
        </RailField>
      }
    />
  );
}

/** Project row for the rail; lists the chosen client's projects. */
export function ProjectRailField({
  projects, projectId, clientId, disabled, side, onPick,
}: {
  projects: ProjectListRow[];
  projectId: string | null;
  clientId: string | null;
  disabled: boolean;
  side: Side;
  onPick: (projectId: string | null) => void;
}) {
  const forClient = projects.filter((pr) => !clientId || pr.client_id === clientId);
  const project = projects.find((pr) => pr.id === projectId) ?? null;
  return (
    <RailPicker
      side={side}
      placeholder="Search projects"
      value={projectId ?? "__none"}
      emptyText={() => "No projects for this client yet"}
      onPick={(v) => onPick(v === "__none" ? null : v)}
      options={[
        ...forClient.map((pr) => ({ value: pr.id, label: pr.title, leading: <Dot id={pr.id} /> })),
        { value: "__none", label: "No project" },
      ]}
      trigger={
        <RailField label="Project" disabled={disabled}>
          {project ? (
            <>
              <Dot id={project.id} />
              <span className="truncate">{project.title}</span>
            </>
          ) : (
            <span className="font-normal text-[var(--fg-3)]">{forClient.length ? "Link a project" : "No projects yet"}</span>
          )}
        </RailField>
      }
    />
  );
}

/** Currency row for the rail. */
export function CurrencyRailField({
  value, clientCurrency, disabled, side, onPick,
}: {
  value: string;
  clientCurrency: string | null;
  disabled: boolean;
  side: Side;
  onPick: (code: string) => void;
}) {
  return (
    <RailPicker
      side={side}
      placeholder="Search currencies"
      value={value}
      onPick={onPick}
      options={SUPPORTED_CURRENCIES.map((c) => ({
        value: c.code,
        label: c.code,
        secondary: c.name,
        keywords: c.name,
        trailing: clientCurrency === c.code ? <span className="text-[11px] text-[var(--fg-3)]">client default</span> : undefined,
      }))}
      trigger={
        <RailField label="Currency" disabled={disabled}>
          <Code>{value}</Code>
        </RailField>
      }
    />
  );
}

/** The "Billed to" block on the paper; clicking it opens the client picker. */
export function BilledToBlock({
  clients, clientId, readOnly, onPick,
}: {
  clients: ClientRow[];
  clientId: string | null;
  readOnly: boolean;
  onPick: (clientId: string) => void;
}) {
  const client = clients.find((c) => c.id === clientId) ?? null;
  return (
    <RailPicker
      side="bottom"
      placeholder="Search clients"
      value={clientId}
      onPick={onPick}
      options={clientOptions(clients)}
      trigger={
        <PaperField readOnly={readOnly} aria-label="Billed to" className="min-h-[60px] w-full">
          {client ? (
            <>
              <div className="party__name">{client.company ?? client.name}</div>
              <div className="party__line">
                {[client.contact_name, client.address, client.email].filter(Boolean).map((l, i) => (
                  <span key={i} className="block">{l}</span>
                ))}
              </div>
            </>
          ) : (
            <span className="font-medium text-[var(--sheet-accent)]">Choose a client</span>
          )}
        </PaperField>
      }
    />
  );
}
