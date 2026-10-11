"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "manpower:cmdk-recent";
const MAX_RECENT = 5;

export type RecentItem = {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
  kind: "client" | "project" | "document" | "nav";
};

function readRecentItems(): RecentItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is RecentItem =>
        item != null &&
        typeof item === "object" &&
        typeof (item as RecentItem).id === "string" &&
        typeof (item as RecentItem).label === "string" &&
        typeof (item as RecentItem).href === "string",
    );
  } catch {
    return [];
  }
}

function writeRecentItems(items: RecentItem[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setRecentItems(readRecentItems());
  }, []);

  const pushRecentItem = useCallback((item: RecentItem) => {
    setRecentItems((prev) => {
      const next = [
        item,
        ...prev.filter((existing) => existing.href !== item.href),
      ].slice(0, MAX_RECENT);
      writeRecentItems(next);
      return next;
    });
  }, []);

  const clearRecentItems = useCallback(() => {
    writeRecentItems([]);
    setRecentItems([]);
  }, []);

  return { recentItems, pushRecentItem, clearRecentItems };
}
