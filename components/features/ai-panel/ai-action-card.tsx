"use client";

import Link from "next/link";
import { Check, CreditCard, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { entityPath, ENTITY_LABELS } from "@/lib/routes";
import type { ActionEvent } from "@/lib/assistant/stream-events";

type AiActionCardProps = {
  action: ActionEvent;
};

type ActionKind = "create" | "update" | "delete" | "payment";

const ICON_FOR_KIND: Record<ActionKind, typeof Check> = {
  create: Check,
  update: Pencil,
  delete: Trash2,
  payment: CreditCard,
};

const STRIPE_TONE: Record<ActionKind, string> = {
  create: "bg-[var(--success)]",
  update: "bg-primary",
  delete: "bg-[var(--danger)]",
  payment: "bg-primary",
};

/**
 * `ActionEvent` carries only a human summary, not the originating tool name,
 * so the kind (and therefore icon/stripe color) is inferred from the
 * summary's leading text. The wording comes from `summarizeAction()` in
 * `lib/assistant/action-summary.ts`, which is the source of truth for this
 * string — stay in sync with its templates, not `ACTION_LABELS` (that only
 * drives the `tool_start` chip text, e.g. "Creating…"). Prefix matching
 * mirrors `AiConfirmCard`'s `confirm.summary.toLowerCase().startsWith(...)`
 * pattern (`components/features/ai-panel/ai-confirm-card.tsx`).
 */
function inferActionKind(summary: string): ActionKind {
  const lower = summary.toLowerCase();
  if (lower.startsWith("delete")) {
    return "delete";
  }
  if (lower.startsWith("record payment")) {
    return "payment";
  }
  if (lower.startsWith("created")) {
    return "create";
  }
  return "update";
}

/**
 * A completed write, reported as it happens. Safe writes run without asking,
 * so this card is the user's record that something changed — and the door
 * back to the new record. Risky writes (delete, status change, payment)
 * already paused on `AiConfirmCard`; only safe/internal actions land here.
 *
 * No Undo button in v1 — see the deviation note in the plan. `undoToken`
 * stays on the wire format so adding one later needs no protocol change.
 */
export function AiActionCard({ action }: AiActionCardProps) {
  const kind = inferActionKind(action.summary);
  const Icon = ICON_FOR_KIND[kind];
  const tone = STRIPE_TONE[kind];
  const label = ENTITY_LABELS[action.entity] ?? action.entity;
  const href = entityPath(action.entity, action.entityId);

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className={cn("w-1 shrink-0", tone)} aria-hidden />
      <div className="flex flex-1 items-center justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Icon className="size-3.5 shrink-0 text-[var(--fg-2)]" strokeWidth={1.6} aria-hidden />
            <Badge variant="secondary" className="text-[10px]">
              {label}
            </Badge>
          </div>
          <p className="line-clamp-2 text-sm text-foreground">{action.summary}</p>
        </div>
        {href ? (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            nativeButton={false}
            render={<Link href={href} />}
          >
            View →
          </Button>
        ) : null}
      </div>
    </div>
  );
}
