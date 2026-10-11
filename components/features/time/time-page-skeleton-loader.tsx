"use client";

import { TimePageSkeleton } from "@/components/features/time/skeletons";
import { useSkeletonCount } from "@/hooks/use-skeleton-count";

export function TimePageSkeletonLoader() {
  const todayRowCount = useSkeletonCount("time:today");
  const earlierRowCount = useSkeletonCount("time:earlier");
  return (
    <TimePageSkeleton
      todayRowCount={todayRowCount}
      earlierRowCount={earlierRowCount}
    />
  );
}
