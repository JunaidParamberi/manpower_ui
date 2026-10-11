"use client";

import { createContext, useContext } from "react";
import type { PinnedItem } from "./queries";

type PinnedItemsContextValue = {
  pinnedItems: PinnedItem[];
  isPinned: (itemType: PinnedItem["item_type"], itemId: string) => boolean;
};

const PinnedItemsContext = createContext<PinnedItemsContextValue>({
  pinnedItems: [],
  isPinned: () => false,
});

export function PinnedItemsProvider({
  children,
  pinnedItems,
}: {
  children: React.ReactNode;
  pinnedItems: PinnedItem[];
}) {
  const isPinned = (itemType: PinnedItem["item_type"], itemId: string) =>
    pinnedItems.some((p) => p.item_type === itemType && p.item_id === itemId);

  return (
    <PinnedItemsContext.Provider value={{ pinnedItems, isPinned }}>
      {children}
    </PinnedItemsContext.Provider>
  );
}

export function usePinnedItems() {
  return useContext(PinnedItemsContext);
}
