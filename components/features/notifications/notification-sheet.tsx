"use client";

import { Bell, BellOff, BellRing, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { clearAllNotifications, markAllNotificationsRead } from "@/lib/notifications/actions";
import {
  groupNotificationsByTime,
  partitionNotifications,
  TIME_GROUP_LABELS,
} from "@/lib/notifications/notification-utils";
import type { NotificationRow } from "@/types";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { NotificationItem } from "./notification-item";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: NotificationRow[];
  unreadCount: number;
  browserPermission: NotificationPermission;
};

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-1.5 pt-3">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      {count != null && count > 0 && (
        <span className="text-[11px] tabular-nums text-muted-foreground/60">
          {count}
        </span>
      )}
      <div className="h-px flex-1 bg-border/40" />
    </div>
  );
}

/**
 * `title` is the day bucket ("Today", "Yesterday"). It only earns a line when
 * the section spans more than one day — otherwise it repeats what the section
 * label above it already said, which is how the panel ended up with two
 * stacked eyebrows saying nearly the same thing.
 */
function NotificationSection({
  title,
  items,
  showDayLabel,
  onNavigate,
}: {
  title: string;
  items: NotificationRow[];
  showDayLabel: boolean;
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-0">
      {showDayLabel && (
        <div className="flex items-center px-4 pb-0.5 pt-2">
          <span className="text-[11px] text-muted-foreground/60">{title}</span>
        </div>
      )}
      {items.map((n) => (
        <NotificationItem key={n.id} notification={n} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

function BrowserNotificationPrompt({
  permission,
}: {
  permission: NotificationPermission;
}) {
  const { requestPermission, supported } = useBrowserNotifications();

  if (!supported || permission === "granted" || permission === "denied") {
    return null;
  }

  return (
    <div className="mx-3 mb-1 mt-2 flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
      <BellRing className="size-3.5 shrink-0 text-muted-foreground" />
      <p className="min-w-0 flex-1 text-[11px] leading-snug text-muted-foreground">
        Get browser alerts for new activity
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-6 shrink-0 px-2.5 text-[11px] font-medium"
        onClick={requestPermission}
      >
        Enable
      </Button>
    </div>
  );
}

function BrowserNotificationDenied() {
  return (
    <div className="mx-3 mb-1 mt-2 flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
      <BellOff className="size-3.5 shrink-0 text-muted-foreground/50" />
      <p className="text-[11px] text-muted-foreground/60">
        Browser alerts blocked — enable in browser settings
      </p>
    </div>
  );
}

export function NotificationSheet({
  open,
  onOpenChange,
  notifications,
  unreadCount,
  browserPermission,
}: Props) {
  const router = useRouter();
  const [markAllPending, startMarkAll] = useTransition();
  const [clearPending, startClear] = useTransition();
  const { unread, read } = partitionNotifications(notifications);
  const unreadGroups = groupNotificationsByTime(unread);
  const readGroups = groupNotificationsByTime(read);

  const handleMarkAll = () => {
    startMarkAll(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  /**
   * Clearing deletes every notification with no undo. Moving the control to the
   * footer stopped it being triggered by accident on open, but a single
   * deliberate click still destroyed the lot — so the first click only arms it.
   */
  const [confirmingClear, setConfirmingClear] = useState(false);

  // Never leave the panel armed: reopening should start from a resting state.
  useEffect(() => {
    if (!open) setConfirmingClear(false);
  }, [open]);

  const handleClearAll = () => {
    setConfirmingClear(false);
    startClear(async () => {
      await clearAllNotifications();
      router.refresh();
    });
  };

  const close = () => onOpenChange(false);
  const hasAny = notifications.length > 0;
  /**
   * Base UI focuses the first tabbable element when the sheet opens. Without
   * this the header's first button took focus, so Enter right after opening
   * fired a destructive action. Focus the (non-interactive) title row instead:
   * screen readers still announce the dialog, and the first Tab lands on a
   * notification row rather than anything that deletes data.
   */
  const initialFocusRef = useRef<HTMLDivElement>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
        initialFocus={initialFocusRef}
      >
        {/* Header */}
        <SheetHeader className="flex-none border-b border-border/50 px-4 pb-2.5 pt-3.5">
          {/* Title row — pr-10 clears shadcn's built-in X button */}
          <div
            ref={initialFocusRef}
            tabIndex={-1}
            className="flex items-center gap-2.5 pr-10 outline-none"
          >
            <div className="flex size-6 items-center justify-center rounded-md bg-muted">
              <Bell className="size-3.5 text-muted-foreground" />
            </div>
            <SheetTitle className="text-sm font-semibold tracking-tight">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Actions row — anchored left, away from Sheet's X.
              Only the non-destructive action lives here; "Clear all" sits in
              the footer so it neither takes opening focus nor outranks it. */}
          {hasAny && unreadCount > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 rounded-md px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                disabled={markAllPending || clearPending}
                onClick={handleMarkAll}
              >
                Mark all read
              </Button>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {/* Browser notification opt-in / denied banner */}
          {browserPermission !== "granted" && (
            browserPermission === "denied" ? (
              <BrowserNotificationDenied />
            ) : (
              <BrowserNotificationPrompt permission={browserPermission} />
            )
          )}

          {!hasAny ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
              <div className="relative flex size-14 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-muted/60" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-border/40" />
                <Bell className="relative size-6 text-muted-foreground/50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-foreground">
                  All caught up
                </p>
                <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">
                  Invoice payments, quote approvals, and client activity show up here.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col pb-8 pt-1">
              {/* Unread section */}
              {unread.length > 0 && (
                <div>
                  <SectionLabel label="Unread" count={unread.length} />
                  {unreadGroups.map(({ group, items }) => (
                    <NotificationSection
                      key={`unread-${group}`}
                      title={TIME_GROUP_LABELS[group]}
                      items={items}
                      showDayLabel={unreadGroups.length > 1}
                      onNavigate={close}
                    />
                  ))}
                </div>
              )}

              {/* Read section — "Read" divider only shown when unread section also exists */}
              {read.length > 0 && (
                <div className={unread.length > 0 ? "mt-2" : ""}>
                  {unread.length > 0 && <SectionLabel label="Read" />}
                  {readGroups.map(({ group, items }) => (
                    <NotificationSection
                      key={`read-${group}`}
                      title={TIME_GROUP_LABELS[group]}
                      items={items}
                      showDayLabel={readGroups.length > 1}
                      onNavigate={close}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {hasAny && (
          <SheetFooter className="flex-none border-t border-border/50 px-4 py-2.5">
            {confirmingClear ? (
              <div className="flex w-full items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Delete all {notifications.length} notification
                  {notifications.length === 1 ? "" : "s"}?
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  autoFocus
                  className="h-6 gap-1 rounded-md px-2 text-[11px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={clearPending || markAllPending}
                  onClick={handleClearAll}
                >
                  <Trash2 className="size-3" />
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 rounded-md px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setConfirmingClear(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-fit gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground/60 hover:text-destructive"
                disabled={clearPending || markAllPending}
                onClick={() => setConfirmingClear(true)}
              >
                <Trash2 className="size-3" />
                Clear all
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
