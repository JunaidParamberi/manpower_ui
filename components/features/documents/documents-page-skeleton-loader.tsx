"use client";

import { DocumentDetailSkeleton } from "@/components/features/documents/skeletons";
import { useSkeletonCount } from "@/hooks/use-skeleton-count";

/** Detail-pane loading state — list pane stays live in DocumentsShell aside. */
export function DocumentsPageSkeletonLoader() {
  useSkeletonCount("documents:list");
  return <DocumentDetailSkeleton />;
}
