"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocumentUploadFieldProps = {
  label: string;
  accept?: string;
  existingUrl: string | null;
  existingLabel?: string;
  pendingFile?: File | null;
  onFileSelected: (file: File) => void;
  onClearPending?: () => void;
  onRemoveExisting?: () => void;
  disabled?: boolean;
};

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

export function DocumentUploadField({
  label,
  accept = DEFAULT_ACCEPT,
  existingUrl,
  existingLabel,
  pendingFile,
  onFileSelected,
  onClearPending,
  onRemoveExisting,
  disabled = false,
}: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>

      {existingUrl && !pendingFile && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-sm",
          )}
        >
          <a
            href={existingUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-2 truncate text-foreground hover:underline"
          >
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{existingLabel ?? "Document"}</span>
          </a>
          {onRemoveExisting && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRemoveExisting}
              aria-label={`Remove ${label}`}
            >
              <X />
            </Button>
          )}
        </div>
      )}

      {pendingFile && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2 truncate">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{pendingFile.name}</span>
          </span>
          {onClearPending && !disabled && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onClearPending} aria-label="Remove selected file">
              <X />
            </Button>
          )}
        </div>
      )}

      {!existingUrl && !pendingFile && (
        <label
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border/80 px-3 py-4 text-sm text-muted-foreground hover:bg-muted/30",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <Upload className="size-4" />
          Choose from existing or drag and drop a file
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            disabled={disabled}
            onChange={handleChange}
          />
        </label>
      )}
    </div>
  );
}
