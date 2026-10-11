"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { voidDocument } from "@/lib/documents/document-mutations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface VoidDocumentButtonProps {
  documentId: string;
  documentStatus: string;
}

export function VoidDocumentButton({ documentId, documentStatus }: VoidDocumentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  if (documentStatus === "voided") {
    return null;
  }

  const handleVoid = () => {
    if (reason.trim().length < 5) {
      setError("Reason must be at least 5 characters.");
      return;
    }
    setError("");
    setLoading(true);
    startTransition(async () => {
      const result = await voidDocument(documentId, reason);
      if (result.ok) {
        toast.success("Document voided.");
        setOpen(false);
        router.refresh();
      } else {
        setError(result.message);
        toast.error(result.message);
      }
      setLoading(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" className="text-destructive hover:text-destructive">
            <Ban />
            <span className="hidden sm:inline">Void</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Void document</DialogTitle>
          <DialogDescription>
            This marks the document as voided with an audit trail. It cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="void-reason">Reason for voiding</Label>
            <Textarea
              id="void-reason"
              placeholder="e.g. Duplicate document, client cancelled order…"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              maxLength={500}
              rows={3}
            />
            <span className="text-xs text-muted-foreground text-right">{reason.length}/500</span>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleVoid}
            disabled={loading || reason.trim().length < 5}
            className="gap-2"
          >
            {loading ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Voiding…
              </>
            ) : (
              "Void document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
