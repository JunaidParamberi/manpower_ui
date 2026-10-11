"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileText, FolderKanban, Paperclip, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  composedEmailSchema,
  type ComposedEmailInput,
} from "@/lib/validations/composed-email";
import { sendComposedEmail } from "@/lib/email/send-composed-email";
import type { CommunicationDraftLink } from "@/lib/ai/communication-draft-result";

const LINK_ICON = {
  document: FileText,
  client: UserRound,
  project: FolderKanban,
} as const;

interface EmailComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTo: string;
  initialSubject: string;
  initialBody: string;
  /**
   * Record the email is about. Prefills the recipient when `initialTo` is
   * empty, and a document link offers to attach its PDF.
   */
  link?: CommunicationDraftLink | null;
  /** Called after a successful send, e.g. to mark a follow-up as sent. */
  onSent?: () => void;
}

export function EmailComposerModal({
  open,
  onOpenChange,
  initialTo,
  initialSubject,
  initialBody,
  link = null,
  onSent,
}: EmailComposerModalProps) {
  const [isPending, startTransition] = useTransition();
  const isDocument = link?.kind === "document";
  const [attachPdf, setAttachPdf] = useState(isDocument);
  const resolvedTo = initialTo || link?.recipientEmail || "";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComposedEmailInput>({
    resolver: zodResolver(composedEmailSchema),
    defaultValues: {
      to: resolvedTo,
      subject: initialSubject,
      body: initialBody,
    },
  });

  useEffect(() => {
    if (open) {
      reset({ to: resolvedTo, subject: initialSubject, body: initialBody });
      setAttachPdf(isDocument);
    }
  }, [open, resolvedTo, initialSubject, initialBody, isDocument, reset]);

  function onSubmit(values: ComposedEmailInput) {
    startTransition(async () => {
      const result = await sendComposedEmail({
        ...values,
        documentId: isDocument ? link?.id : undefined,
        clientId: link?.clientId ?? undefined,
        attachPdf: isDocument ? attachPdf : undefined,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Email sent");
      onOpenChange(false);
      onSent?.();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compose email</DialogTitle>
          <DialogDescription>
            Review and edit the AI-drafted email before sending.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1" noValidate>
          {link ? (
            <LinkedRecord
              link={link}
              attachPdf={attachPdf}
              onAttachPdfChange={setAttachPdf}
              disabled={isPending}
            />
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="composer-to">To</Label>
            <Input
              id="composer-to"
              type="email"
              placeholder="client@example.com"
              {...register("to")}
            />
            {errors.to && <p className="text-xs text-destructive">{errors.to.message}</p>}
            {link && !link.recipientEmail && !initialTo ? (
              <p className="text-xs text-[var(--fg-3)]">
                No email saved for this client. Add one to send.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="composer-subject">Subject</Label>
            <Input
              id="composer-subject"
              placeholder="Subject"
              {...register("subject")}
            />
            {errors.subject && (
              <p className="text-xs text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="composer-body">Message</Label>
            <Textarea
              id="composer-body"
              rows={10}
              placeholder="Write your message…"
              {...register("body")}
            />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending…" : "Send email"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinkedRecord({
  link,
  attachPdf,
  onAttachPdfChange,
  disabled,
}: {
  link: CommunicationDraftLink;
  attachPdf: boolean;
  onAttachPdfChange: (next: boolean) => void;
  disabled: boolean;
}) {
  const Icon = LINK_ICON[link.kind];
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="size-4 shrink-0 text-[var(--fg-3)]" aria-hidden />
        <p className="truncate text-sm text-foreground">
          <span className="text-[var(--fg-3)]">About </span>
          {link.label}
        </p>
      </div>
      {link.kind === "document" ? (
        <label className="flex shrink-0 items-center gap-2 text-xs text-[var(--fg-2)]">
          <Paperclip className="size-3.5" aria-hidden />
          Attach PDF
          <Switch
            checked={attachPdf}
            onCheckedChange={onAttachPdfChange}
            disabled={disabled}
            aria-label="Attach the document PDF"
          />
        </label>
      ) : null}
    </div>
  );
}
