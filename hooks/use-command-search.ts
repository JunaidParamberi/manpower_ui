"use client";

import { useEffect, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { searchGlobalEntities } from "@/lib/search/search-actions";
import type { GlobalSearchResults } from "@/lib/search/types";

const EMPTY_RESULTS: GlobalSearchResults = {
  clients: [],
  projects: [],
  documents: [],
};

type CommandSearchState = {
  results: GlobalSearchResults;
  loading: boolean;
  error: string | null;
};

export function useCommandSearch(query: string, enabled: boolean) {
  const debouncedQuery = useDebounce(query.trim(), 250);
  const [state, setState] = useState<CommandSearchState>({
    results: EMPTY_RESULTS,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled || debouncedQuery.length === 0) {
      setState({ results: EMPTY_RESULTS, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    void searchGlobalEntities({ query: debouncedQuery }).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setState({ results: EMPTY_RESULTS, loading: false, error: result.error });
        return;
      }
      setState({ results: result.results, loading: false, error: null });
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, enabled]);

  const isSearching = enabled && query.trim().length > 0;
  const showLoading =
    isSearching && (state.loading || debouncedQuery !== query.trim());

  return {
    results: state.results,
    loading: showLoading,
    error: state.error,
    isSearching,
    debouncedQuery,
  };
}
