"use client";

import { useMemo, useState } from "react";

export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const count = selectedIds.size;

  const isAllSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const isIndeterminate = useMemo(
    () => !isAllSelected && items.some((item) => selectedIds.has(item.id)),
    [items, selectedIds, isAllSelected]
  );

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return {
    selectedIds,
    count,
    isAllSelected,
    isIndeterminate,
    toggleRow,
    toggleAll,
    clearSelection,
  };
}
