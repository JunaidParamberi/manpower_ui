"use client";

import { NewDocumentButton } from "@/components/features/documents/workspace/new-document-button";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Building2, CalendarDays, Check, Copy, Mail, MoreHorizontal, Pencil, Phone, Trash2, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { clientMonogram, formatClientSince } from "@/lib/clients/display";
import { bandLabel } from "@/lib/clients/health-display";
import type { HealthBand } from "@/lib/clients/health-facts";
import type { ClientRow } from "@/types";
import { cn } from "@/lib/utils";

import { DeleteClientButton } from "@/components/features/clients/delete-client-button";
import { EmailComposerModal } from "@/components/features/communication/email-composer-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ClientDetailHeaderProps = {
  client: ClientRow;
  linkedProjectsCount?: number;
  linkedDocumentsCount?: number;
  /** Kraft's help button for this client; sits first in the actions. */
  kraft?: React.ReactNode;
};

/** Same bands as scoreClientHealth in lib/clients/health-facts.ts (80 / 55 / 30). */
function bandOf(score: number | null): HealthBand | null {
  if (score === null) return null;
  if (score >= 80) return "excellent";
  if (score >= 55) return "healthy";
  if (score >= 30) return "needs_attention";
  return "at_risk";
}

const BAND_PILL: Record<HealthBand, string> = {
  excellent: "bg-[var(--success-soft)] text-[var(--success)]",
  healthy: "bg-[var(--success-soft)] text-[var(--success)]",
  needs_attention: "bg-[var(--warning-soft)] text-[var(--warning)]",
  at_risk: "bg-[var(--danger-soft)] text-[var(--danger)]",
};

const PILL = "inline-flex items-center gap-1 rounded-full px-2 py-px text-label font-medium";

const META_ITEM = "inline-flex min-w-0 max-w-full items-center gap-1.5";
const META_ICON = "size-3.5 shrink-0 text-[var(--fg-3)]";

function MetaItem({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className={META_ITEM}>
      <Icon className={META_ICON} aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Email or phone in the meta line; the leading icon turns into a copy icon on hover. */
function CopyItem({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label} ${value}`}
      title={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copied");
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Could not copy");
        }
      }}
      className={cn(META_ITEM, "group rounded-sm text-[var(--fg-2)] hover:text-foreground")}
    >
      {copied ? (
        <Check className={META_ICON} aria-hidden />
      ) : (
        <>
          <Icon className={cn(META_ICON, "group-hover:hidden group-focus-visible:hidden")} aria-hidden />
          <Copy className={cn(META_ICON, "hidden group-hover:block group-focus-visible:block")} aria-hidden />
        </>
      )}
      <span className="truncate">{value}</span>
    </button>
  );
}

export function ClientDetailHeader({
  client,
  linkedProjectsCount = 0,
  linkedDocumentsCount = 0,
  kraft,
}: ClientDetailHeaderProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const band = bandOf(client.health_score);
  const since = formatClientSince(client.created_at);
  const email = client.email?.trim() || null;
  const phone = client.phone?.trim() || null;
  const place = client.company?.trim() || client.address?.trim() || null;
  const contact = client.contact_name?.trim() || null;

  return (
    <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-4 sm:px-6 lg:px-7 lg:pt-6">
      <Link
        href="/clients"
        className="inline-flex w-fit items-center gap-1.5 text-meta text-[var(--fg-3)] hover:text-foreground lg:hidden"
      >
        <ArrowLeft className="size-3.5" />
        Clients
      </Link>
      <div className="flex flex-wrap items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[var(--accent-soft)] text-body font-semibold text-primary">
          {clientMonogram(client.name)}
        </span>
        <div className="min-w-0 flex-1 basis-60">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 font-heading text-[20px] font-semibold leading-tight tracking-[-0.015em]">
              {client.name}
            </h2>
            <span className={cn(PILL, "bg-[var(--bg-subtle)] capitalize text-[var(--fg-2)]")}>
              {client.relationship_status}
            </span>
            {band ? (
              <span className={cn(PILL, BAND_PILL[band])}>
                {bandLabel(band)} · <span className="tabular-nums">{client.health_score}</span>
              </span>
            ) : (
              <span className={cn(PILL, "bg-[var(--bg-subtle)] text-[var(--fg-2)]")}>Not scored</span>
            )}
          </div>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-meta text-[var(--fg-3)]">
            {contact ? <MetaItem icon={UserRound}>{contact}</MetaItem> : null}
            {email ? <CopyItem icon={Mail} value={email} label="email" /> : null}
            {phone ? <CopyItem icon={Phone} value={phone} label="phone" /> : null}
            {place ? <MetaItem icon={Building2}>{place}</MetaItem> : null}
            {since ? <MetaItem icon={CalendarDays}>Client since {since}</MetaItem> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {kraft}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setComposerOpen(true)}
            disabled={!email}
            title={email ? undefined : "Add an email address to this client first"}
          >
            <Mail />
            Email
          </Button>
          <NewDocumentButton contextType="invoice" clientId={client.id} label="New invoice" />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`More for ${client.name}`}>
                  <MoreHorizontal />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem render={<Link href={`/clients/${client.id}/edit`} />}>
                <Pencil data-icon="inline-start" />
                Edit client
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 data-icon="inline-start" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteClientButton
        clientId={client.id}
        clientName={client.name}
        linkedProjectsCount={linkedProjectsCount}
        linkedDocumentsCount={linkedDocumentsCount}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        hideTrigger
      />
      <EmailComposerModal
        open={composerOpen}
        onOpenChange={setComposerOpen}
        initialTo={email ?? ""}
        initialSubject={`Hello ${contact ?? client.name}`}
        initialBody=""
      />
    </div>
  );
}
