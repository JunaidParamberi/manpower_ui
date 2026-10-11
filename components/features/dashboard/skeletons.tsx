import {
  SkeletonKPI,
  Skeleton,
} from "@/components/shared/skeletons";
import { SkeletonRepeat } from "@/components/shared/skeleton-repeat";

export function DashboardPageSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
      className="flex flex-col gap-5"
    >
      {/* Page header */}
      <div className="flex flex-col gap-1.5">
        <Skeleton w={72} h={11} r={3} />
        <Skeleton w={220} h={24} r={4} />
      </div>

      {/* Money row — mirrors MoneyRow */}
      <div className="grid gap-3 @sm/shell:grid-cols-2 @3xl/shell:grid-cols-4">
        <SkeletonRepeat count={4} render={(i) => <SkeletonKPI key={i} />} />
      </div>

      {/* Two-lane grid — mirrors DashboardLanes */}
      <div className="grid gap-4 @5xl/shell:grid-cols-[1.6fr_1fr]">
        {/* Main lane: three queue cards, a chart, an activity feed */}
        <div className="flex min-w-0 flex-col gap-4">
          <SkeletonRepeat count={3} render={(i) => <Skeleton key={i} w="100%" h={54} r={12} />} />
          <Skeleton w="100%" h={280} r={12} />
          <Skeleton w="100%" h={240} r={12} />
        </div>

        {/* Rail lane: brief, work, clients */}
        <div className="flex min-w-0 flex-col gap-4">
          <SkeletonRepeat count={3} render={(i) => <Skeleton key={i} w="100%" h={200} r={12} />} />
        </div>
      </div>
    </div>
  );
}

export function ProtectedPlaceholderSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="flex flex-col gap-3 max-w-xl"
    >
      <Skeleton w={176} h={32} r={6} />
      <Skeleton w="100%" h={16} r={4} />
      <Skeleton w="80%" h={16} r={4} />
    </div>
  );
}