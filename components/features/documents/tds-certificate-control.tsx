"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  uploadTdsCertificate,
  removeTdsCertificate,
  getTdsCertificateSignedUrl,
} from "@/lib/documents/tds-certificate-actions";

type Props = {
  documentId: string;
  /**
   * Pass `true` when `documents.tds_certificate_url` is non-null on initial
   * render. The component re-fetches the signed URL on mount so clicking
   * "View certificate" always gets a fresh 1-hour link.
   */
  hasCertificate: boolean;
};

export function TdsCertificateControl({
  documentId,
  hasCertificate: initialHasCert,
}: Props) {
  const [hasCert, setHasCert] = useState(initialHasCert);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch signed URL on mount (and when cert changes to true)
  useEffect(() => {
    if (!hasCert) {
      setSignedUrl(null);
      return;
    }
    getTdsCertificateSignedUrl(documentId)
      .then((url) => setSignedUrl(url))
      .catch(() => setSignedUrl(null));
  }, [documentId, hasCert]);

  function handleUpload(file: File) {
    setUploadError(null);
    const formData = new FormData();
    formData.append("certificate", file);
    startTransition(async () => {
      try {
        await uploadTdsCertificate(documentId, formData);
        setHasCert(true);
        // Signed URL will refresh via effect when hasCert flips
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Upload failed. Please try again.",
        );
      }
    });
  }

  function handleRemove() {
    setUploadError(null);
    startTransition(async () => {
      try {
        await removeTdsCertificate(documentId);
        setHasCert(false);
        setSignedUrl(null);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Could not remove certificate.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
        Form 16A certificate
      </span>

      {hasCert ? (
        <div className="flex items-center gap-2">
          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-3 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">View certificate</span>
            </a>
          ) : (
            <span className="inline-flex flex-1 items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
              <FileText className="size-3.5 shrink-0" />
              Certificate uploaded
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isPending}
            onClick={handleRemove}
            title="Remove certificate"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleUpload(file);
                // Reset so the same file can be re-uploaded after removal
                e.target.value = "";
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            {isPending ? "Uploading…" : "Upload Form 16A"}
          </Button>
        </>
      )}

      {uploadError && (
        <p className="text-xs text-destructive">{uploadError}</p>
      )}
    </div>
  );
}
