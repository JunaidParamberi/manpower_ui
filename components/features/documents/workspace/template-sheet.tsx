"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createDraftDocument, deleteTemplate } from "@/lib/documents/document-mutations";
import { documentTypeLabel } from "@/lib/documents/display";
import { localTodayIso } from "@/lib/documents/draft-defaults";
import { editorHrefForNew } from "@/lib/documents/new-document-href";
import { groupTemplates } from "@/lib/documents/template-groups";
import { templatePreview } from "@/lib/documents/template-preview";
import type { DocumentTemplateRow, DocumentType } from "@/types";
import { cn } from "@/lib/utils";

const TYPE_DOT: Partial<Record<DocumentType, string>> = {
  proposal: "bg-[var(--chart-1)]",
  quote: "bg-[var(--warning)]",
  invoice: "bg-[var(--success)]",
  local_purchase_order: "bg-[var(--info)]",
  other: "bg-[var(--fg-3)]",
};

/** Start a document from one of your saved templates or a starter. Variables show as readable chips. */
export function TemplateSheet({
  open, onOpenChange, templates, clientId, projectId, initialType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: DocumentTemplateRow[];
  clientId?: string | null;
  projectId?: string | null;
  initialType?: DocumentType | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Blocks a second click before React re-renders, so one click is one draft. */
  const busy = useRef(false);
  const { mine, starters } = groupTemplates(templates, initialType);

  function use(t: DocumentTemplateRow) {
    if (busy.current) return;
    busy.current = true;
    setBusyId(t.id);
    start(async () => {
      const r = await createDraftDocument({ type: t.type, templateId: t.id, clientId, projectId, today: localTodayIso() });
      if (!r.ok) {
        busy.current = false;
        setBusyId(null);
        toast.error(r.message);
        return;
      }
      router.push(editorHrefForNew(r.document.id));
    });
  }
  function remove(t: DocumentTemplateRow) {
    start(async () => {
      const r = await deleteTemplate(t.id);
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success("Template deleted");
      router.refresh();
    });
  }

  const card = (t: DocumentTemplateRow, own: boolean) => (
    <div
      key={t.id}
      className={cn(
        "group relative flex flex-col gap-2 rounded-[var(--surface-radius)] border border-border bg-[var(--bg-surface)] p-3.5 text-left shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--border-strong)]",
        busyId === t.id && "opacity-60",
      )}
    >
      <button type="button" disabled={pending} onClick={() => use(t)} className="absolute inset-0 rounded-[inherit]" aria-label={`Use ${t.name}`} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold">{t.name}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--fg-3)]">
          <span aria-hidden className={cn("size-1.5 rounded-full", TYPE_DOT[t.type] ?? "bg-[var(--fg-3)]")} />
          {documentTypeLabel(t.type)}
        </span>
      </div>
      <p className="line-clamp-3 text-[12px] leading-relaxed text-[var(--fg-2)]">
        {templatePreview(t.content_json, 140).map((seg, i) =>
          seg.kind === "text" ? (
            <span key={i}>{seg.text}</span>
          ) : (
            <span key={i} className="mx-0.5 rounded-full bg-[var(--accent-soft)] px-1.5 text-[11px] text-[var(--accent)]">{seg.label}</span>
          ),
        )}
      </p>
      {own ? (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<button type="button" aria-label={`More for ${t.name}`} className="grid size-6 place-items-center rounded-[var(--item-radius)] text-[var(--fg-3)] hover:bg-[var(--bg-subtle)]" />}
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-[var(--danger)]" onClick={() => remove(t)}>Delete template</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  );

  const empty = mine.length === 0 && starters.length === 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Start from a template</DialogTitle>
          <DialogDescription>Names in colour fill in from the client or project you link.</DialogDescription>
        </DialogHeader>
        {empty ? (
          <p className="py-6 text-center text-[13px] text-[var(--fg-3)]">No templates yet. Save any document as a template from its ⋯ menu.</p>
        ) : null}
        {mine.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold tracking-[0.04em] text-[var(--fg-3)] uppercase">Your templates</h3>
            <div className="grid gap-2.5 sm:grid-cols-2">{mine.map((t) => card(t, true))}</div>
          </section>
        ) : null}
        {starters.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold tracking-[0.04em] text-[var(--fg-3)] uppercase">Starters</h3>
            <div className="grid gap-2.5 sm:grid-cols-2">{starters.map((t) => card(t, false))}</div>
          </section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
