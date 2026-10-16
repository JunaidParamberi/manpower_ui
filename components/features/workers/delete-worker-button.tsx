"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
};

export function DeleteWorkerButton({ workerId, workerName }: DeleteWorkerButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
