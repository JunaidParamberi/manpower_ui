// components/features/dashboard/queue-snooze-menu.tsx
"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { QueueItem } from "@/lib/dashboard/snapshot-types";
import type { SnoozeDuration } from "@/lib/dashboard/dismissals";

type QueueSnoozeMenuProps = {
  item: QueueItem;
  onSnooze: (duration: SnoozeDuration) => void;
  onDismiss: () => void;
};

const SNOOZE_LABELS: { duration: SnoozeDuration; label: string }[] = [
  { duration: "tomorrow", label: "Tomorrow" },
  { duration: "next_week", label: "Next week" },
  { duration: "until_change", label: "Until it changes" },
];

export function QueueSnoozeMenu({ item, onSnooze, onDismiss }: QueueSnoozeMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg text-[var(--fg-3)]"
            aria-label={`More actions for ${item.title}`}
          >
            <MoreHorizontal size={14} strokeWidth={1.6} />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href={item.href} />}>Open</DropdownMenuItem>
        {item.clientId ? (
          <DropdownMenuItem render={<Link href={`/clients/${item.clientId}`} />}>
            View {item.clientName ?? "client"}
          </DropdownMenuItem>
        ) : null}
        {item.clientEmail ? (
          <DropdownMenuItem render={<a href={`mailto:${item.clientEmail}`} />}>
            Email {item.clientEmail}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Snooze</DropdownMenuLabel>
          {SNOOZE_LABELS.map(({ duration, label }) => (
            <DropdownMenuItem key={duration} onClick={() => onSnooze(duration)}>
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDismiss}>
          Dismiss
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}