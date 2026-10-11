"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { discardUntouchedDraft } from "@/lib/documents/document-mutations";
import { localTodayIso } from "@/lib/documents/draft-defaults";
import type { AutosaveQueue } from "@/lib/documents/editor/autosave-queue";
import type { DocumentStatus, DocumentType } from "@/types";
import { ContextBanner } from "./context-banner";
import { NewDocumentButton } from "./new-document-button";
import { ReadinessLine } from "./readiness-line";
import { SaveIndicator } from "./save-indicator";
import { SentStrip } from "./sent-strip";
import { useDocumentAutosave } from "./use-document-autosave";
import { WorkspaceFrame } from "./workspace-frame";
import { WorkspaceHeader, type StatusTone } from "./workspace-header";

export type WorkspaceMode = "edit" | "read";

/** What the paper and rail renderers get from the workspace. */
export type EditorCtx = {
  mode: WorkspaceMode;
  queue: AutosaveQueue;
  /** True in the read view, and in the edit view of a document whose content is locked. */
  readOnly: boolean;
  /** Picker side: left of the rail on desktop, under the trigger in the mobile sheet. */
  railSide: "left" | "bottom";
  /** `YYYY-MM-DD` in the user's day. */
  today: string;
  openRail: () => void;
};

export type DocumentWorkspaceProps = {
  mode: WorkspaceMode;
  /** Opened straight after New: an untouched draft is deleted when you leave it. */
  fresh: boolean;
  documentId: string;
  backHref: string;
  backLabel: string;
  title: string;
  status: DocumentStatus;
  statusLabel: string;
  statusTone: StatusTone;
  /** The server still accepts content edits (drafts only). */
  canEditContent: boolean;
  canSwitchToEdit: boolean;
  editHref: string;
  readHref: string;
  kraft?: ReactNode;
  actionsRead: ReactNode;
  /** Shown beside Done while editing, e.g. Send. A node, not a function: it is built on the server. */
  actionsEdit: ReactNode;
  /** The type the New button in the editing header creates. */
  newType?: DocumentType;
  banner?: { clientName: string; clientColor: string; filled: string[] } | null;
  sentParts?: string[];
  editingSentNote?: string | null;
  renderPaper: (ctx: EditorCtx) => ReactNode;
  renderRail: (ctx: EditorCtx) => ReactNode;
  belowPaper?: ReactNode;
  readinessMessage: string | null;
  readinessAction?: { label: string; onClick: () => void };
  today: string;
};

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desktop;
}

/**
 * One page per document: editable paper plus a settings rail for drafts, the same paper
 * read-only for everything else. Owns autosave, Done and leaving.
 */
export function DocumentWorkspace(p: DocumentWorkspaceProps) {
  const router = useRouter();
  const { queue, status, error } = useDocumentAutosave();
  const desktop = useIsDesktop();
  // The server renders in UTC; the browser knows the user's own day.
  const [today, setToday] = useState(p.today);
  useEffect(() => setToday(localTodayIso()), []);
  // `fresh` only means "just created" for this visit: drop it so a reload or Back never treats the draft as untouched.
  useEffect(() => {
    if (p.fresh) window.history.replaceState(window.history.state, "", `${window.location.pathname}?edit=1`);
  }, [p.fresh]);
  const [railOpen, setRailOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(Boolean(p.banner));
  const [leaving, setLeaving] = useState(false);
  const editing = p.mode === "edit";
  const readOnly = !editing || !p.canEditContent;

  const ctx: EditorCtx = {
    mode: p.mode,
    queue,
    readOnly,
    railSide: desktop ? "left" : "bottom",
    today,
    openRail: () => setRailOpen(true),
  };

  /** Save everything, drop an untouched new draft, then go. */
  const leave = useCallback(
    async (href: string) => {
      setLeaving(true);
      const ok = await queue.flush();
      if (!ok) {
        setLeaving(false);
        toast.error("Couldn't save your last change. Try again.");
        return;
      }
      if (p.fresh && !queue.hasWritten()) await discardUntouchedDraft(p.documentId);
      router.push(href);
    },
    [queue, p.fresh, p.documentId, router],
  );

  const done = useCallback(async () => {
    setLeaving(true);
    const ok = await queue.flush();
    if (!ok) {
      setLeaving(false);
      return;
    }
    if (p.fresh && !queue.hasWritten()) {
      await discardUntouchedDraft(p.documentId);
      router.replace(p.backHref);
      return;
    }
    router.replace(p.readHref);
    router.refresh();
    toast.success(p.readinessMessage ? `Saved. ${p.readinessMessage}` : "Saved. Ready to send.");
  }, [queue, p.fresh, p.documentId, p.backHref, p.readHref, p.readinessMessage, router]);

  const header = (
    <WorkspaceHeader
      backHref={p.backHref}
      backLabel={p.backLabel}
      title={p.title}
      statusLabel={p.statusLabel}
      statusTone={p.statusTone}
      kraft={p.kraft}
      onBack={editing ? (href) => void leave(href) : undefined}
      save={editing ? <SaveIndicator status={status} error={error} onRetry={() => void queue.retry()} /> : null}
      actions={
        <>
          {!desktop ? (
            <Button variant="outline" size="sm" onClick={() => setRailOpen(true)}>
              <SlidersHorizontal className="size-3.5" />
              Settings
            </Button>
          ) : null}
          {editing ? (
            <>
              {p.newType ? <NewDocumentButton contextType={p.newType} variant="outline" onBeforeNavigate={leave} /> : null}
              {p.actionsEdit}
              <Button variant="outline" size="sm" onClick={() => void done()} disabled={leaving}>
                <Check className="size-3.5" />
                Done
              </Button>
            </>
          ) : (
            <>
              {p.canSwitchToEdit ? (
                <Button variant="outline" size="sm" onClick={() => router.push(p.editHref)}>
                  Edit
                </Button>
              ) : null}
              {p.actionsRead}
            </>
          )}
        </>
      }
    />
  );

  const canvasTop = (
    <>
      {editing && p.banner && bannerOpen ? <ContextBanner {...p.banner} onDismiss={() => setBannerOpen(false)} /> : null}
      {!editing && p.sentParts?.length ? <SentStrip parts={p.sentParts} /> : null}
      {editing && p.editingSentNote ? (
        <p className="w-full max-w-[800px] px-4 text-[12px] text-[var(--fg-2)] sm:px-0">{p.editingSentNote}</p>
      ) : null}
      {["draft", "sent", "viewed"].includes(p.status) ? (
        <ReadinessLine message={p.readinessMessage} action={editing ? p.readinessAction : undefined} />
      ) : null}
    </>
  );

  return (
    <WorkspaceFrame
      desktop={desktop}
      header={header}
      canvasTop={canvasTop}
      paper={p.renderPaper(ctx)}
      belowPaper={
        <>
          {editing && !readOnly ? (
            <p aria-hidden className="hidden flex-wrap justify-center gap-3.5 text-[11px] text-[var(--fg-3)] sm:flex">
              <span>Enter new line</span>
              <span>Tab next field</span>
              <span>⌫ on an empty line deletes it</span>
              <span>↑ ↓ on a number steps it</span>
              <span>Drag ⋮⋮ to reorder</span>
            </p>
          ) : null}
          {p.belowPaper}
        </>
      }
      rail={p.renderRail(ctx)}
      railOpen={railOpen}
      onRailOpenChange={setRailOpen}
      railLabel="Document settings"
    />
  );
}
