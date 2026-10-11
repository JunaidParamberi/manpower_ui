"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteClientWithAllData } from "@/lib/clients/client-mutations";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteClientButtonProps = {
  clientId: string;
  clientName: string;
  linkedProjectsCount?: number;
  linkedDocumentsCount?: number;
  /** Controlled mode, for opening the dialog from a menu item. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export function DeleteClientButton({
  clientId,
  clientName,
  linkedProjectsCount = 0,
  linkedDocumentsCount = 0,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: DeleteClientButtonProps) {
  const router = useRouter();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasDependencies = linkedProjectsCount > 0 || linkedDocumentsCount > 0;

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteClientWithAllData(clientId);
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message ?? "Failed to delete client.");
        return;
      }
      setOpen(false);
      toast.success("Client deleted");
      router.push("/clients");
      router.refresh();
    });
  }

  return (
    <>
      {hideTrigger ? null : (
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          Delete client
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Delete this client?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{clientName}</span>{" "}
              from your workspace.
            </DialogDescription>
            {hasDependencies ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <p className="font-medium mb-1">Everything linked will also be deleted:</p>
                <ul className="list-disc list-inside space-y-0.5 text-destructive/80">
                  {linkedProjectsCount > 0 ? (
                    <li>
                      {linkedProjectsCount} project{linkedProjectsCount === 1 ? "" : "s"}{" "}
                      (and their tasks &amp; time entries)
                    </li>
                  ) : null}
                  {linkedDocumentsCount > 0 ? (
                    <li>
                      {linkedDocumentsCount} document{linkedDocumentsCount === 1 ? "" : "s"}{" "}
                      (invoices, quotes, receipts)
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </DialogHeader>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending
                ? "Deleting…"
                : hasDependencies
                  ? "Delete client + all data"
                  : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
