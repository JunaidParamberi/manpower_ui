import { Skeleton, SkeletonText } from "@/components/shared/skeletons";

/**
 * Route-level loading state for /marketing. The page is a server component, so
 * there is no client-side pending state to drive MonthCalendar's `isLoading`
 * prop — this skeleton is what covers the fetch instead. Mirrors the real
 * layout: header, four KPI tiles, one control row, then the calendar grid.
 */
export default function MarketingLoading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton w={140} h={26} r={6} />
        <SkeletonText lines={1} />
      </div>

      <div className="grid gap-3 @sm/shell:grid-cols-2 @3xl/shell:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} w="100%" h={78} r={12} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton w={220} h={34} r={8} />
        <Skeleton w={210} h={34} r={8} />
        <Skeleton w={160} h={34} r={8} />
        <Skeleton w={160} h={34} r={8} />
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`head-${i}`} className="bg-muted px-2 py-1.5">
            <Skeleton w="60%" h={10} r={3} />
          </div>
        ))}
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="flex min-h-28 flex-col gap-1.5 bg-card p-1.5">
            <Skeleton w={18} h={12} r={3} />
            <Skeleton w="80%" h={10} r={3} />
          </div>
        ))}
      </div>
    </div>
  );
}
