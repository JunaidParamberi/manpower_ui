"use client";

import { useState } from "react";
import { toast } from "sonner";

import { LegalPolicyLink } from "@/components/legal/legal-policy-link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PENDING_LEGAL_ACCEPTANCE_KEY } from "@/config/legal";
import { recordTermsAndPrivacyAcceptance } from "@/lib/legal/actions";

type Props = {
  open: boolean;
  onAccepted: () => void;
};

export function LegalAcceptanceModal({ open, onAccepted }: Props) {
  const [pending, setPending] = useState(false);

  async function onAccept() {
    setPending(true);
    try {
      const result = await recordTermsAndPrivacyAcceptance();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(PENDING_LEGAL_ACCEPTANCE_KEY);
      }

      onAccepted();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Accept our policies</DialogTitle>
          <DialogDescription>
            Before you continue, please review and accept our Terms of Service and
            Privacy Policy.
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <LegalPolicyLink
              policy="terms"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </LegalPolicyLink>
          </li>
          <li>
            <LegalPolicyLink
              policy="privacy"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </LegalPolicyLink>
          </li>
        </ul>

        <DialogFooter>
          <Button type="button" onClick={onAccept} disabled={pending}>
            {pending ? "Saving…" : "I accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
