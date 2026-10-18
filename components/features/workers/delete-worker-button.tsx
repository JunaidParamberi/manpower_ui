"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteWorker } from "@/lib/workers/worker-mutations";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteWorkerButtonProps = {
  workerId: string;
  workerName: string;
  /** Controlled mode, for opening the dialog from a menu item. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export function DeleteWorkerButton({
  workerId,
  workerName,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
}: DeleteWorkerButtonProps) {
  const router = useRouter();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // A controlled open (e.g. from a menu item) must not show an error from an earlier attempt.
  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteWorker(workerId);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error ?? "Failed to delete worker.");
        return;
      }
      setOpen(false);
      toast.success("Worker deleted");
      router.push("/workers");
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
          Delete worker
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Delete this worker?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{workerName}</span>{" "}
              from your workspace.
            </DialogDescription>
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
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
