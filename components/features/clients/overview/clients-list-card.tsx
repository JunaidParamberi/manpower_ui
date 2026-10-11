"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, FileText, FolderOpen, MoreVertical, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteClientWithAllData } from "@/lib/clients/client-mutations";
import { pinItem, unpinItem } from "@/lib/pinned/actions";
import { usePinnedItems } from "@/lib/pinned/context";
import { PinContextMenu } from "@/components/shared/pin-context-menu";
import type { ClientOverviewRow } from "@/lib/clients/clients-overview-queries";
import { clientMonogram } from "@/lib/clients/display";
import { CLIENT_GROUPS, clientGroupOf } from "@/lib/clients/client-lens";
import { formatCurrency } from "@/lib/utils/format";
import { useAgentGlow } from "@/lib/ai-panel/agent-activity-context";
import { cn } from "@/lib/utils";
import { HealthRing } from "@/components/shared/health-ring";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ClientsListCardProps = {
  clients: ClientOverviewRow[];
  selectedId: string | null;
  defaultCurrency?: string;
  /** Group rows under sticky headings (All lens, no search). */
  groups: boolean;
  nowIso: string;
  onClearFilters: () => void;
  onSelect: (clientId: string) => void;
};

function clientMeta(client: ClientOverviewRow): string {
  return [client.contact_name, client.company ?? client.address].filter(Boolean).join(" · ");
}

function owedNote(client: ClientOverviewRow): { text: string; late: boolean } | null {
  if (client.outstanding_total <= 0) return null;
  if (client.overdue_days > 0) return { text: `${client.overdue_days}d late`, late: true };
  if (!client.next_due_date) return { text: "open", late: false };
  const due = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${client.next_due_date}T00:00:00.000Z`),
  );
  return { text: `due ${due}`, late: false };
}

type ClientRowProps = {
  client: ClientOverviewRow;
  currency: string;
  selected: boolean;
  isPinned: boolean;
  pinPending: boolean;
  onSelect: (clientId: string) => void;
  onTogglePin: (client: ClientOverviewRow, pinned: boolean) => void;
  onEdit: (clientId: string) => void;
  onDelete: (client: ClientOverviewRow) => void;
};

function ClientRow({
  client,
  currency,
  selected,
  isPinned,
  pinPending,
  onSelect,
  onTogglePin,
  onEdit,
  onDelete,
}: ClientRowProps) {
  const glow = useAgentGlow("clients", client.id);
  const note = owedNote(client);

  return (
    <PinContextMenu
      itemType="client"
      itemId={client.id}
      itemLabel={client.name}
      itemHref={`/clients/${client.id}`}
      isPinned={isPinned}
    >
      <li
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        className={cn(
          "flex cursor-pointer items-center gap-3 border-l-2 py-2.5 ps-[14px] pe-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:ps-[22px] sm:pe-5 lg:ps-[26px]",
          selected ? "border-l-primary bg-[var(--bg-subtle)]" : "border-l-transparent hover:bg-[var(--bg-subtle)]",
          glow && "agent-glow",
        )}
        onClick={() => onSelect(client.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(client.id);
          }
        }}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--accent-soft)] text-label font-semibold text-primary">
          {clientMonogram(client.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-body font-medium text-foreground">{client.name}</div>
          <div className="truncate text-meta text-[var(--fg-3)]">
            {clientMeta(client) || client.email || "No contact details"}
          </div>
        </div>
        {note ? (
          <div className="shrink-0 text-right">
            <div className="text-meta font-medium tabular-nums text-foreground">
              {formatCurrency(client.outstanding_total, currency)}
            </div>
            <div className={cn("text-label", note.late ? "text-[var(--danger)]" : "text-[var(--fg-3)]")}>{note.text}</div>
          </div>
        ) : null}
        <div className="flex shrink-0 items-center gap-0.5">
          <HealthRing score={client.health_score} size={26} strokeWidth={2.5} />
          <div onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${client.name}`}>
                    <MoreVertical />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onSelect(client.id)}>Open</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(client.id)}>Edit</DropdownMenuItem>
                <DropdownMenuItem
                  disabled={pinPending}
                  onClick={() => onTogglePin(client, isPinned)}
                >
                  {isPinned ? (
                    <>
                      <PinOff className="mr-2 size-3.5" />
                      Unpin from sidebar
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 size-3.5" />
                      Pin to sidebar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(client)}>
                  <Trash2 data-icon="inline-start" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </li>
    </PinContextMenu>
  );
}

export function ClientsListCard({
  clients,
  selectedId,
  defaultCurrency = "USD",
  groups,
  nowIso,
  onClearFilters,
  onSelect,
}: ClientsListCardProps) {
  const router = useRouter();
  const { isPinned } = usePinnedItems();
  const [pinPending, startPinTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<ClientOverviewRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteClientWithAllData(pendingDelete.id);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      setPendingDelete(null);
      router.refresh();
    });
  }

  const renderRow = (client: ClientOverviewRow) => (
    <ClientRow
      key={client.id}
      client={client}
      currency={client.currency ?? defaultCurrency}
      selected={client.id === selectedId}
      isPinned={isPinned("client", client.id)}
      pinPending={pinPending}
      onSelect={onSelect}
      onEdit={(clientId) => router.push(`/clients/${clientId}/edit`)}
      onTogglePin={(client, pinned) => {
        startPinTransition(async () => {
          const result = pinned
            ? await unpinItem("client", client.id)
            : await pinItem({
                itemType: "client",
                itemId: client.id,
                itemLabel: client.name,
                itemHref: `/clients/${client.id}`,
              });
          toast[result.ok ? "success" : "error"](
            result.ok
              ? pinned
                ? "Unpinned from sidebar"
                : "Pinned to sidebar"
              : pinned
                ? "Failed to unpin"
                : "Failed to pin",
          );
        });
      }}
      onDelete={(client) => {
        setDeleteError(null);
        setPendingDelete(client);
      }}
    />
  );

  return (
    <>
      {clients.length === 0 ? (
        <div className="flex flex-col items-start gap-2 px-4 py-6 sm:px-6 lg:px-7">
          <p className="text-body text-[var(--fg-3)]">No clients match.</p>
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : groups ? (
        CLIENT_GROUPS.map((group) => {
          const rows = clients.filter((c) => clientGroupOf(c, nowIso) === group.id);
          if (rows.length === 0) return null;
          return (
            <section key={group.id} aria-label={group.label}>
              <h2 className="sticky top-0 z-10 bg-[var(--panel)] px-4 pt-3.5 pb-1.5 text-label font-medium uppercase tracking-[0.04em] text-[var(--fg-3)] sm:px-6 lg:px-7">
                {group.label}
              </h2>
              <ul role="list">{rows.map(renderRow)}</ul>
            </section>
          );
        })
      ) : (
        <ul role="list" className="pt-1.5">
          {clients.map(renderRow)}
        </ul>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete this client?</DialogTitle>
            <DialogDescription>
              Permanently remove{" "}
              <span className="font-medium text-foreground">
                {pendingDelete?.name ?? "this client"}
              </span>{" "}
              from your workspace.
            </DialogDescription>
            {pendingDelete && (pendingDelete.projects_count > 0 || pendingDelete.recent_documents.length > 0) ? (
              <div className="mt-1 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  Everything linked will also be deleted
                </div>
                <div className="space-y-2">
                  {pendingDelete.projects_count > 0 ? (
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                        <FolderOpen className="size-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight text-foreground">
                          {pendingDelete.projects_count} project{pendingDelete.projects_count === 1 ? "" : "s"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          tasks &amp; time entries included
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {pendingDelete.recent_documents.length > 0 ? (
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                        <FileText className="size-3 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight text-foreground">
                          {pendingDelete.recent_documents.length} document{pendingDelete.recent_documents.length === 1 ? "" : "s"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          invoices, quotes &amp; receipts
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingDelete(null);
                setDeleteError(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending || !pendingDelete}
            >
              {isPending
                ? "Deleting…"
                : pendingDelete && (pendingDelete.projects_count > 0 || pendingDelete.recent_documents.length > 0)
                  ? "Delete client + all data"
                  : "Delete client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
