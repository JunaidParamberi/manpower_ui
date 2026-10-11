"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAiPanel } from "@/lib/ai-panel/context";

type AiNewSessionButtonProps = {
  className?: string;
  iconClassName?: string;
};

/**
 * Starting a new session is non-destructive (the current thread is saved,
 * per the dialog copy below) — but it does interrupt an in-progress
 * conversation, so it still asks first. Uses the app's own Dialog rather
 * than `window.confirm`: a native dialog blocks the page (breaks browser
 * automation entirely) and looks inconsistent with the rest of the design
 * system, which never uses browser-native alerts/confirms/prompts.
 */
export function AiNewSessionButton({ className, iconClassName }: AiNewSessionButtonProps) {
  const { startNewSession } = useAiPanel();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Start a new session"
        className={cn(
          "flex items-center justify-center rounded-md text-[var(--fg-2)] transition-colors hover:bg-[var(--bg-surface)] hover:text-foreground",
          className,
        )}
      >
        <Plus className={iconClassName} strokeWidth={1.6} aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Start a new session?</DialogTitle>
            <DialogDescription>Your current thread is saved.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setOpen(false);
                await startNewSession();
                toast.success("Started a new session");
              }}
            >
              Start new session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
