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
import { sendQuote } from "@/lib/email/send-quote";

interface SendQuoteButtonProps {
  documentId: string;
  defaultEmail?: string;
  disabled?: boolean;
}

export function SendQuoteButton({
  documentId,
  defaultEmail = "",
  disabled = false,
}: SendQuoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("Quote from Your Business");
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
      const result = await sendQuote({
        documentId,
        recipientEmail,
        subject: subject || undefined,
      });
      if (result.ok) {
        setOpen(false);
        setStatus("idle");
        router.refresh();
        toast.success("Quote sent!", {
          description: `Sent to ${recipientEmail}`,
        });
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "Failed to send quote.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" disabled={disabled} aria-label="Send quote">
            <Mail />
            <span className="hidden sm:inline">Send quote</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Quote</DialogTitle>
          <DialogDescription>
            The quote will be emailed to the recipient with an approval link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="send-email">Recipient Email</Label>
            <Input
              id="send-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="client@example.com"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="send-subject">Subject</Label>
            <Input
              id="send-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Quote from Your Business"
            />
          </div>

          {status === "error" && (
            <p className="text-xs text-destructive">{errorMessage}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={status === "loading"}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={status === "loading" || !recipientEmail}
            className="gap-2"
          >
            {status === "loading" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending…
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
