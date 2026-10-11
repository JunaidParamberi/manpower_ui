"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileStack, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createDraftDocument } from "@/lib/documents/document-mutations";
import { documentTypeLabel } from "@/lib/documents/display";
import { localTodayIso } from "@/lib/documents/draft-defaults";
import { editorHrefForNew, NEW_DOCUMENT_TYPES } from "@/lib/documents/new-document-href";
import { useOptionalAiPanel } from "@/lib/ai-panel/context";
import type { DocumentType } from "@/types";

/**
 * Creates a draft and opens it straight in the editor. The arrow lists the other types,
 * templates and Kraft. The client and project are filled in from where you are.
 */
export function NewDocumentButton({
  contextType = "invoice",
  clientId = null,
  projectId = null,
  size = "sm",
  variant = "primary",
  label,
  onBeforeNavigate,
  onOpenTemplates,
}: {
  contextType?: DocumentType;
  clientId?: string | null;
  projectId?: string | null;
  size?: "sm" | "default";
  variant?: "primary" | "outline";
  label?: string;
  /** Runs instead of navigating, e.g. to save the document you are leaving first. */
  onBeforeNavigate?: (href: string) => Promise<void>;
  onOpenTemplates?: () => void;
}) {
  const router = useRouter();
  const kraft = useOptionalAiPanel();
  const [pending, start] = useTransition();
  /** Blocks a second click before React re-renders, so one click is one draft. */
  const busy = useRef(false);

  function create(type: DocumentType) {
    if (busy.current) return;
    busy.current = true;
    start(async () => {
      const r = await createDraftDocument({ type, clientId, projectId, today: localTodayIso() });
      if (!r.ok) {
        busy.current = false;
        toast.error(r.message);
        return;
      }
      const href = editorHrefForNew(r.document.id);
      if (onBeforeNavigate) await onBeforeNavigate(href);
      else router.push(href);
    });
  }

  function askKraft() {
    if (!kraft) return;
    const what = documentTypeLabel(contextType).toLowerCase();
    const where = projectId ? " for this project" : clientId ? " for this client" : "";
    kraft.submitPrompt(`Draft a ${what}${where}`, "agent");
  }

  const v = variant === "primary" ? "default" : "outline";
  return (
    <div className="inline-flex rounded-[var(--item-radius)] shadow-[var(--shadow-xs)]">
      <Button size={size} variant={v} disabled={pending} onClick={() => create(contextType)} className="rounded-r-none">
        <Plus className="size-3.5" />
        {label ?? `New ${documentTypeLabel(contextType).toLowerCase()}`}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size={size}
              variant={v}
              disabled={pending}
              aria-label="More document types"
              className="rounded-l-none border-l border-l-[color-mix(in_srgb,currentColor_20%,transparent)] px-1.5"
            />
          }
        >
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {NEW_DOCUMENT_TYPES.map((t) => (
            <DropdownMenuItem key={t.type} onClick={() => create(t.type)}>
              {t.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              if (onOpenTemplates) onOpenTemplates();
              else router.push(`/documents/new?templates=1${clientId ? `&client=${clientId}` : ""}${projectId ? `&projectId=${projectId}` : ""}`);
            }}
          >
            <FileStack className="size-3.5" />
            From a template…
          </DropdownMenuItem>
          {kraft ? (
            <DropdownMenuItem onClick={askKraft}>
              <Sparkles className="size-3.5" />
              Ask Kraft to draft
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
