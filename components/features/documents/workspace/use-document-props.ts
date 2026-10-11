"use client";

import { useCallback, useRef, useState } from "react";
import { renameDocument, updateDocumentLinks } from "@/lib/documents/document-mutations";
import type { AutosaveQueue } from "@/lib/documents/editor/autosave-queue";
import type { DocumentType } from "@/types";

type Patch = { title?: string; client_id?: string | null; project_id?: string | null };

/**
 * Name, client and project of a document. Each saves on its own, so changing the client
 * never rewrites the title and a document named automatically keeps following its contents.
 */
export function useDocumentProps(init: {
  documentId: string;
  /** Kept so editors state which kind of document they save for. */
  type: DocumentType;
  title: string;
  clientId: string | null;
  projectId: string | null;
}) {
  const [state, setState] = useState({ title: init.title, clientId: init.clientId, projectId: init.projectId });
  const latest = useRef(state);
  latest.current = state;

  const save = useCallback(
    (queue: AutosaveQueue, patch: Patch) => {
      const next = {
        title: patch.title ?? latest.current.title,
        clientId: patch.client_id !== undefined ? patch.client_id : latest.current.clientId,
        projectId: patch.project_id !== undefined ? patch.project_id : latest.current.projectId,
      };
      latest.current = next;
      setState(next);

      if (patch.title !== undefined) {
        // Typing a name is debounced; the last value wins.
        queue.schedule("name", async () => {
          const r = await renameDocument(init.documentId, latest.current.title);
          return r.ok ? { ok: true } : { ok: false, error: r.message };
        });
      }
      if (patch.client_id !== undefined || patch.project_id !== undefined) {
        queue.schedule(
          "links",
          async () => {
            const r = await updateDocumentLinks(init.documentId, {
              client_id: latest.current.clientId,
              project_id: latest.current.projectId,
            });
            return r.ok ? { ok: true } : { ok: false, error: r.message };
          },
          { immediate: true },
        );
      }
    },
    [init.documentId],
  );

  return { ...state, save };
}
