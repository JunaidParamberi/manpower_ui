"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { FileText, Plus, X } from "lucide-react";

import { addWorkerDocumentListItem, removeWorkerDocumentListItem } from "@/lib/workers/worker-document-mutations";
import { WORKER_DOCUMENT_ACCEPT } from "@/lib/workers/worker-document-slots";
import { Button } from "@/components/ui/button";
import type { WorkerDocumentRow } from "@/types";

type DocumentListSectionProps = {
  workerId: string;
  category: "cicpa" | "additional";
  title: string;
  description?: string;
  documents: WorkerDocumentRow[];
  onChanged: () => void;
};

export function DocumentListSection({ workerId, category, title, description, documents, onChanged }: DocumentListSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(file: File) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", file.name);
      const result = await addWorkerDocumentListItem(workerId, category, fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Document added");
      onChanged();
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeWorkerDocumentListItem(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChanged();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/80 p-4">
      <div>
        <h3 className="font-medium">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm">
          <a href={doc.file_url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 truncate hover:underline">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{doc.label}</span>
          </a>
          <Button type="button" variant="ghost" size="icon-sm" disabled={isPending} onClick={() => handleRemove(doc.id)} aria-label={`Remove ${doc.label}`}>
            <X />
          </Button>
        </div>
      ))}

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-primary">
        <Plus className="size-4" /> Add document
        <input
          ref={inputRef}
          type="file"
          accept={WORKER_DOCUMENT_ACCEPT}
          className="sr-only"
          disabled={isPending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </label>
    </div>
  );
}
