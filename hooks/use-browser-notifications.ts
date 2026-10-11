"use client";

import { useCallback, useEffect, useState } from "react";
import type { NotificationRow } from "@/types";

const SHOWN_KEY = "manpower:shown-notifications";

function getShownIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SHOWN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markShown(id: string) {
  try {
    const ids = getShownIds();
    ids.add(id);
    // Cap at 500 to prevent unbounded growth
    const arr = [...ids].slice(-500);
    localStorage.setItem(SHOWN_KEY, JSON.stringify(arr));
  } catch {
    // localStorage unavailable — silent fail
  }
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const notifyNew = useCallback((notifications: NotificationRow[]) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const shown = getShownIds();
    for (const n of notifications) {
      if (shown.has(n.id) || n.read_at) continue;
      markShown(n.id);
      // Title carries the event; body is the same supporting line the in-app
      // row shows, omitted when the payload has none.
      const notif = new Notification(n.payload.title, {
        ...(n.payload.body ? { body: n.payload.body } : {}),
        icon: "/favicon.ico",
        tag: n.id,
        silent: false,
      });
      notif.onclick = () => {
        window.focus();
        window.location.href = n.payload.href;
        notif.close();
      };
    }
  }, []);

  return {
    permission,
    requestPermission,
    notifyNew,
    supported: typeof window !== "undefined" && "Notification" in window,
  };
}
