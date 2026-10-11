"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { formatNotificationBadgeCount } from "@/lib/notifications/notification-utils";
import type { NotificationRow } from "@/types";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { NotificationSheet } from "./notification-sheet";

type Props = {
  notifications: NotificationRow[];
  unreadCount: number;
};

export function NotificationBell({ notifications, unreadCount }: Props) {
  const [open, setOpen] = useState(false);
  const { notifyNew, permission } = useBrowserNotifications();
  const badgeLabel = formatNotificationBadgeCount(unreadCount);

  // Fire browser notifications for any unseen unread items on mount
  useEffect(() => {
    if (unreadCount > 0) {
      notifyNew(notifications.filter((n) => !n.read_at));
    }
  // Run once on mount — intentionally no deps on notifyNew to avoid re-firing on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open drawer when pane Inbox item is clicked
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("manpower:open-inbox", h);
    return () => window.removeEventListener("manpower:open-inbox", h);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        onClick={() => setOpen(true)}
      >
        <Bell />
        {badgeLabel ? (
          <Badge
            variant="destructive"
            className={cn(
              "absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none"
            )}
          >
            {badgeLabel}
          </Badge>
        ) : null}
      </Button>

      <NotificationSheet
        open={open}
        onOpenChange={setOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        browserPermission={permission}
      />
    </>
  );
}
