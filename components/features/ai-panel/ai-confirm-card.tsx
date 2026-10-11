"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { confirmAssistantAction } from "@/lib/assistant/confirm-action";
import type { ConfirmEvent } from "@/lib/assistant/stream-events";

type AiConfirmCardProps = {
  confirm: ConfirmEvent;
  onResolved: (
    approved: boolean,
    write: { entity: string; entityId: string | null } | null,
  ) => void;
};

/**
 * A risky write staged server-side, waiting on the user. The loop is paused
 * holding its state; clicking Confirm resumes it, Cancel discards it.
 */
export function AiConfirmCard({ confirm, onResolved }: AiConfirmCardProps) {
  const [pending, setPending] = useState(false);
  const isDestructive = confirm.summary.toLowerCase().startsWith("delete");

  async function resolve(approved: boolean) {
    setPending(true);
    try {
      const result = await confirmAssistantAction(
        confirm.threadId,
        confirm.toolUseId,
        approved,
      );

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      onResolved(approved, result.entity ? { entity: result.entity, entityId: result.entityId } : null);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--warning)]/40 bg-[var(--warning-soft)] px-3 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-[var(--warning)]"
          strokeWidth={1.6}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{confirm.summary}</p>
          {confirm.detail.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {confirm.detail.map((line) => (
                <li key={line} className="text-xs text-[var(--fg-3)]">
                  {line}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant={isDestructive ? "destructive" : "default"}
              disabled={pending}
              onClick={() => void resolve(true)}
            >
              {pending ? "Working…" : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => void resolve(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
