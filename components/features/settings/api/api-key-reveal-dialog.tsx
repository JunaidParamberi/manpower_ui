"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ApiKeyRevealDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  secret: string;
};

/** Shows a freshly created key exactly once, with copy support. */
export function ApiKeyRevealDialog({
  open,
  onOpenChange,
  name,
  secret,
}: ApiKeyRevealDialogProps) {
  const [copied, setCopied] = useState(false);

  async function copySecret() {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-[18px]" />
            {name}
          </DialogTitle>
          <DialogDescription>
            Copy this key now — for security it will never be shown again.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input readOnly value={secret} className="font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={copySecret}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Anyone with this key can read your business data (and update safe
            records). Treat it like a password. Revoke it from API &amp;
            integrations if it leaks.
          </span>
        </div>

        <DialogFooter>
          <Button onClick={copySecret}>
            {copied ? "Copied" : "Copy key"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}