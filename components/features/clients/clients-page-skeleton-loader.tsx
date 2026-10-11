"use client";

import { ClientDetailSkeleton } from "@/components/features/clients/skeletons";
import { useSkeletonCount } from "@/hooks/use-skeleton-count";

export function ClientsPageSkeletonLoader() {
  useSkeletonCount("clients:list");
  return <ClientDetailSkeleton />;
}
