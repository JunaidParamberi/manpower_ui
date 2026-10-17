"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProjectClient } from "@/lib/project-clients/project-client-mutations";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteProjectClientButtonProps = {
  projectClientId: string;
  projectClientName: string;
  onDeleted?: () => void;
};

export function DeleteProjectClientButton({
  projectClientId,
  projectClientName,
  onDeleted,
}: DeleteProjectClientButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProjectClient(projectClientId);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error ?? "Failed to delete client.");
        return;
      }
      setOpen(false);
      toast.success("Project client deleted");
      onDeleted?.();
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={`Delete ${projectClientName}`}
      >
        <Trash2 className="text-destructive" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Delete this client?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{projectClientName}</span>{" "}
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
