"use client";

import { useCallback, useRef, useState } from "react";
import { deleteLineItem, reorderLineItems, upsertLineItem } from "@/lib/documents/invoice-mutations";
import type { AutosaveQueue } from "@/lib/documents/editor/autosave-queue";
import { fromRows, toUpsertPayload, type EditorLine } from "@/lib/documents/editor/line-items-keyboard";
import type { LineItemRow } from "@/types";
import type { LineChange } from "./paper/line-items-grid";

/**
 * Line-item state plus its autosaved writes. Works for any document type: the line-item
 * mutations take a document id. Writes read the line at run time, so a debounced write
 * always sends the final text, and a quick second edit of a new line updates rather than inserts twice.
 */
export function useLineItems(documentId: string, rows: LineItemRow[]) {
  const [lines, setLines] = useState<EditorLine[]>(() => fromRows(rows));
  const seq = useRef(0);
  const latest = useRef(lines);
  latest.current = lines;
  /** Ids returned by inserts, read synchronously (state lags a render). */
  const savedIds = useRef(new Map<string, string>());
  const newKey = useCallback(() => `new-${++seq.current}`, []);

  const scheduleOrder = useCallback(
    (queue: AutosaveQueue) => {
      queue.schedule(
        "order",
        async () => {
          const ids = latest.current.map((l) => l.id ?? savedIds.current.get(l.key)).filter((x): x is string => Boolean(x));
          const r = await reorderLineItems(documentId, ids);
          return r.ok ? { ok: true } : { ok: false, error: r.error ?? "Couldn't reorder" };
        },
        { immediate: true },
      );
    },
    [documentId],
  );

  const onChange = useCallback(
    (queue: AutosaveQueue, next: EditorLine[], change: LineChange) => {
      const grew = next.length > latest.current.length;
      setLines(next);
      latest.current = next;

      if ("removedKey" in change) {
        const id = change.removedId ?? savedIds.current.get(change.removedKey) ?? null;
        if (id) {
          queue.schedule(
            `del:${id}`,
            async () => {
              const r = await deleteLineItem(id, documentId);
              return r.ok ? { ok: true } : { ok: false, error: r.error ?? "Couldn't remove line" };
            },
            { immediate: true },
          );
        }
        return;
      }

      if ("reordered" in change) {
        scheduleOrder(queue);
        return;
      }

      const key = change.key;
      queue.schedule(`line:${key}`, async () => {
        const index = latest.current.findIndex((l) => l.key === key);
        if (index === -1) return { ok: true };
        const current = latest.current[index];
        const id = current.id ?? savedIds.current.get(key) ?? null;
        const r = await upsertLineItem(documentId, toUpsertPayload({ ...current, id }, index));
        if (!r.ok) return { ok: false, error: r.error ?? "Couldn't save line" };
        if (!id && r.lineItem) {
          const savedId = r.lineItem.id;
          savedIds.current.set(key, savedId);
          setLines((ls) => ls.map((l) => (l.key === key ? { ...l, id: savedId } : l)));
          // Removed while its insert was in flight: the row exists now, so remove it too.
          if (!latest.current.some((l) => l.key === key)) {
            const del = await deleteLineItem(savedId, documentId);
            if (!del.ok) return { ok: false, error: del.error ?? "Couldn't remove line" };
          }
        }
        return { ok: true };
      });
      // A line added in the middle shares its position with the one below: write the order too.
      if (grew) scheduleOrder(queue);
    },
    [documentId, scheduleOrder],
  );

  /** Replaces the lines with what the server has, e.g. after importing time. */
  const reset = useCallback((next: LineItemRow[]) => {
    const fresh = fromRows(next);
    latest.current = fresh;
    setLines(fresh);
  }, []);

  return { lines, newKey, onChange, reset };
}
