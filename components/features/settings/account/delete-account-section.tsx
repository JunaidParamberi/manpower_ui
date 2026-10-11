"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountSection } from "@/components/features/settings/account/account-section";
import { deleteAccount } from "@/lib/account/actions";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/validations/account";

export function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = useMemo(() => {
    return (
      password.length > 0 &&
      confirmation === DELETE_ACCOUNT_CONFIRMATION &&
      acknowledged
    );
  }, [password, confirmation, acknowledged]);

  function resetDialog() {
    setPassword("");
    setConfirmation("");
    setAcknowledged(false);
    setError(null);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetDialog();
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount({
        password,
        confirmation,
        acknowledged,
      });

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success("Account deleted.");
      router.replace("/auth/account-deleted");
    });
  }

  return (
    <>
      <AccountSection
        variant="danger"
        title="Delete account"
        description="Permanently delete your Manpower account and all associated data. This cannot be undone."
      >
        <Button
          type="button"
          variant="destructive"
          onClick={() => setOpen(true)}
          className="w-fit"
        >
          Delete my account
        </Button>
      </AccountSection>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account permanently?</DialogTitle>
            <DialogDescription>
              This removes your profile, clients, projects, documents, time
              entries, uploaded files, and billing data. There is no recovery
              path after deletion.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="delete_password">Confirm your password</Label>
              <Input
                id="delete_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="delete_confirmation">
                Type {DELETE_ACCOUNT_CONFIRMATION} to confirm
              </Label>
              <Input
                id="delete_confirmation"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={DELETE_ACCOUNT_CONFIRMATION}
                autoComplete="off"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked === true)}
                className="mt-0.5"
              />
              <span>
                I understand this action is permanent and cannot be undone.
              </span>
            </label>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={!canSubmit || pending}
            >
              {pending ? "Deleting…" : "Delete account forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
