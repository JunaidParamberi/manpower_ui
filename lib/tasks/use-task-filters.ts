"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import {
  parseTaskListFilters,
  type TaskListFilters,
} from "@/lib/tasks/task-utils";

export function searchParamsToRecord(
  searchParams: URLSearchParams,
): Record<string, string | undefined> {
  const record: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

/** Live task filters from the URL — keeps sort/status/project in sync after client navigation. */
export function useTaskFilters(fallback?: TaskListFilters): TaskListFilters {
  const searchParams = useSearchParams();

  return useMemo(() => {
    if (searchParams.size === 0 && fallback) {
      return fallback;
    }
    return parseTaskListFilters(searchParamsToRecord(searchParams));
  }, [searchParams, fallback]);
}
