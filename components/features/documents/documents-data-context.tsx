"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { loadMoreDocuments } from "@/lib/documents/document-list-actions";
import type { ListFilters } from "@/lib/documents/list-filters";
import type { DocumentListRow } from "@/types";

type DocumentsDataContextValue = {
  documents: DocumentListRow[];
  recurringSourceDocumentIds: string[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
};

const DocumentsDataContext = createContext<DocumentsDataContextValue | null>(
  null,
);

type DocumentsDataProviderProps = {
  documents: DocumentListRow[];
  recurringSourceDocumentIds: string[];
  hasMore: boolean;
  /**
   * The filters the server already applied to `documents`. Not exposed on
   * the context value — nothing outside this file reads it (DocumentsListPane
   * re-derives type/search from usePathname/useSearchParams). It stays a
   * Provider input only so `loadMore` below can re-apply the same type/search
   * when paginating.
   */
  filters: ListFilters;
  children: ReactNode;
};

export function DocumentsDataProvider({
  documents: initialDocuments,
  recurringSourceDocumentIds,
  hasMore: initialHasMore,
  filters,
  children,
}: DocumentsDataProviderProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // The @list slot re-renders in place for every ?q= change and for every
  // mutation-driven revalidation without unmounting, so a useState initialiser
  // would freeze this list at whatever the server sent on first paint — every
  // create, delete, status change and search keystroke would leave the pane
  // stale until a hard reload. RSC hands a fresh array identity on each server
  // render, so identity is the signal that new data arrived. Adjusting state
  // during render (React's documented pattern) fixes it before paint; a
  // useEffect would flash the stale list first.
  const [seed, setSeed] = useState(initialDocuments);
  // Bumped every time a reconciliation resets `documents`, so an in-flight
  // loadMore (which computed its offset from the pre-reset list, under the
  // pre-reset filters) can tell its result is now stale and discard it instead
  // of appending onto a list it no longer matches. A ref, not `seed` read
  // directly, because loadMore's closure is created on an earlier render and
  // would otherwise see a stale value — do not delete this thinking it's
  // redundant with `seed`.
  const generationRef = useRef(0);
  if (seed !== initialDocuments) {
    setSeed(initialDocuments);
    setDocuments(initialDocuments);
    setHasMore(initialHasMore);
    setIsLoadingMore(false);
    generationRef.current += 1;
  }

  const filterType = filters.type;
  const filterSearch = filters.search;

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    const generation = generationRef.current;
    setIsLoadingMore(true);
    try {
      // Paging stays inside the filtered set: the server action re-applies the
      // same type/search the slot rendered with.
      const result = await loadMoreDocuments(documents.length, {
        type: filterType,
        search: filterSearch,
      });
      if (generation !== generationRef.current) return;
      if (result.ok) {
        setDocuments((prev) => [...prev, ...result.documents]);
        setHasMore(result.hasMore);
      }
    } finally {
      // Only clear the flag if this call still owns it: a superseded request
      // must not clear isLoadingMore out from under a newer request that's
      // still in flight (the reconciliation block already cleared it for the
      // superseded generation, so nothing is left stranded).
      if (generation === generationRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [documents.length, hasMore, isLoadingMore, filterType, filterSearch]);

  const value = useMemo(
    () => ({
      documents,
      recurringSourceDocumentIds,
      hasMore,
      isLoadingMore,
      loadMore,
    }),
    [documents, recurringSourceDocumentIds, hasMore, isLoadingMore, loadMore],
  );

  return (
    <DocumentsDataContext.Provider value={value}>
      {children}
    </DocumentsDataContext.Provider>
  );
}

export function useDocumentsData(): DocumentsDataContextValue {
  const ctx = useContext(DocumentsDataContext);
  if (!ctx) {
    throw new Error("useDocumentsData must be used within DocumentsDataProvider");
  }
  return ctx;
}
