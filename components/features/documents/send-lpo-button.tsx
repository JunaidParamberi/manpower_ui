"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendLpo } from "@/lib/email/send-lpo";

interface SendLpoButtonProps {
  documentId: string;
  defaultEmail?: string;
  disabled?: boolean;
}

export function SendLpoButton({
  documentId,
  defaultEmail = "",
  disabled = false,
}: SendLpoButtonProps) {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStatus("idle");
      setErrorMessage("");
      setRecipientEmail(defaultEmail);
    }
  };

  const handleSend = () => {
    if (!recipientEmail) return;
    setStatus("loading");
    startTransition(async () => {
      const result = await sendLpo({ documentId, recipientEmail });
      if (result.ok) {
        setOpen(false);
        setStatus("idle");
        router.refresh();
        toast.success("LPO sent!", { description: `Sent to ${recipientEmail}` });
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "Failed to send LPO.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" disabled={disabled} aria-label="Send LPO">
            <Mail />
            <span className="hidden sm:inline">Send LPO</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send purchase order</DialogTitle>
          <DialogDescription>
            The LPO will be emailed to the recipient.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lpo-recipient-email">Recipient email</Label>
            <Input
              id="lpo-recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="client@example.com"
            />
          </div>
          {status === "error" && errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!recipientEmail || status === "loading"}
          >
            {status === "loading" ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
