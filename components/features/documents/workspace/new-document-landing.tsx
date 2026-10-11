"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileStack, FileText, Receipt, Handshake, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createDraftDocument } from "@/lib/documents/document-mutations";
import { documentTypeLabel } from "@/lib/documents/display";
import { localTodayIso } from "@/lib/documents/draft-defaults";
import { editorHrefForNew, NEW_DOCUMENT_TYPES } from "@/lib/documents/new-document-href";
import type { DocumentTemplateRow, DocumentType } from "@/types";
import { TemplateSheet } from "./template-sheet";

const ICONS: Partial<Record<DocumentType, typeof FileText>> = {
  invoice: Receipt,
  quote: FileText,
  proposal: Handshake,
  local_purchase_order: ClipboardList,
};

/**
 * The page behind old `/documents/new` links. With a type it creates the draft and moves on;
 * without one it offers the four types and templates.
 */
export function NewDocumentLanding({
  type, clientId, projectId, templates, openTemplates,
}: {
  type: DocumentType | null;
  clientId: string | null;
  projectId: string | null;
  templates: DocumentTemplateRow[];
  openTemplates: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(openTemplates);
  const started = useRef(false);
  const auto = Boolean(type) && !openTemplates;

  function create(t: DocumentType) {
    setError(null);
    start(async () => {
      const r = await createDraftDocument({ type: t, clientId, projectId, today: localTodayIso() });
      if (!r.ok) {
        setError(r.message);
        toast.error(r.message);
        return;
      }
      router.replace(editorHrefForNew(r.document.id));
    });
  }

  // Creating on arrival is a side effect, not data fetching. The ref keeps it to one draft
  // even when React mounts the page twice in development.
  useEffect(() => {
    if (!auto || !type || started.current) return;
    started.current = true;
    create(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (auto && type) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 px-4 text-center">
        {error ? (
          <>
            <p role="alert" className="text-[13px] text-[var(--danger)]">{error}</p>
            <Button size="sm" onClick={() => create(type)} disabled={pending}>Try again</Button>
          </>
        ) : (
          <p role="status" className="text-[13px] text-[var(--fg-2)]">Creating your {documentTypeLabel(type).toLowerCase()}…</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 sm:p-7">
      <div>
        <h1 className="text-[17px] font-semibold tracking-[-0.01em]">New document</h1>
        <p className="mt-1 text-[13px] text-[var(--fg-2)]">Pick a type. It opens ready to fill in.</p>
      </div>
      {error ? <p role="alert" className="text-[13px] text-[var(--danger)]">{error}</p> : null}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {NEW_DOCUMENT_TYPES.map((t) => {
          const Icon = ICONS[t.type] ?? FileText;
          return (
            <button
              key={t.type}
              type="button"
              disabled={pending}
              onClick={() => create(t.type)}
              className="flex items-start gap-3 rounded-[var(--surface-radius)] border border-border bg-[var(--bg-surface)] p-3.5 text-left shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] disabled:opacity-60"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-[var(--item-radius)] bg-[var(--bg-subtle)] text-[var(--fg-2)]"><Icon className="size-4" /></span>
              <span>
                <span className="block text-[13px] font-medium">{t.label}</span>
                <span className="block text-[12px] text-[var(--fg-3)]">{t.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={() => setShowTemplates(true)} className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-[var(--accent)]">
        <FileStack className="size-3.5" />
        From a template…
      </button>
      <TemplateSheet
        open={showTemplates}
        onOpenChange={setShowTemplates}
        templates={templates}
        clientId={clientId}
        projectId={projectId}
        initialType={type}
      />
    </div>
  );
}
