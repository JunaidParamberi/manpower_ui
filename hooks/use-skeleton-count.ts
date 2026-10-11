"use client";

import { useEffect, useState } from "react";

import {
  FINANCE_INVOICE_LIMIT,
  getSkeletonCount,
  resolveSkeletonCount,
  setSkeletonCount,
  type SkeletonCountKey,
} from "@/lib/ui/skeleton-count";

type UseSkeletonCountOptions = {
  cap?: number;
};

export function useSkeletonCount(
  id: SkeletonCountKey,
  options?: UseSkeletonCountOptions,
): number {
  const { cap } = options ?? {};
  const [count, setCount] = useState(0);

  useEffect(() => {
    const stored = getSkeletonCount(id);
    setCount(resolveSkeletonCount(stored, cap));
  }, [id, cap]);

  return count;
}

type SkeletonCountRecorderProps = {
  id: SkeletonCountKey;
  count: number;
};

/** Persists list length after a successful page render for count-matched loading skeletons. */
export function SkeletonCountRecorder({ id, count }: SkeletonCountRecorderProps) {
  useEffect(() => {
    setSkeletonCount(id, count);
  }, [id, count]);

  return null;
}

export { FINANCE_INVOICE_LIMIT };
