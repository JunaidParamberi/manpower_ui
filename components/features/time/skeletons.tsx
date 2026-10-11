import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRepeat } from "@/components/shared/skeleton-repeat";

export type TimePageSkeletonProps = {
  todayRowCount?: number;
  earlierRowCount?: number;
};

/** Mirrors `/time`: hero, live timer card, manual log card, Today table, Earlier table, footer tip. */
export function TimePageSkeleton({
  todayRowCount = 0,
  earlierRowCount = 0,
}: TimePageSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading time tracker"
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-1">
        <Skeleton className="h-9 w-48 max-w-[85%] md:h-10 md:w-56" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 space-y-0">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="size-5 shrink-0 rounded-md" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Skeleton className="h-[4.5rem] w-full max-w-[14rem] rounded-md sm:h-[5.25rem] md:h-[6rem]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="min-h-[4.5rem] w-full rounded-md" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-11 min-w-[7rem] rounded-md" />
            <Skeleton className="h-11 min-w-[7rem] rounded-md" />
            <Skeleton className="h-11 min-w-[7rem] rounded-md" />
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="min-h-[4.5rem] w-full rounded-md" />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 shrink-0 rounded-md sm:w-[11rem]" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-14" />
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 shrink-0 rounded-md sm:w-[11rem]" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-8 flex-col items-stretch border-t border-border sm:flex-row sm:justify-end">
          <Skeleton className="h-9 w-full rounded-md sm:ms-auto sm:w-28" />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0">
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-full max-w-sm sm:flex-1" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="hidden gap-4 border-b border-border pb-2 sm:flex">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="hidden h-4 w-24 lg:block" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="hidden h-4 w-14 sm:block" />
              <Skeleton className="hidden h-4 w-14 md:block" />
            </div>
            <SkeletonRepeat
              count={todayRowCount}
              render={(i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-3 border-b border-border/60 py-3 last:border-0"
                >
                  <Skeleton className="h-5 min-w-[120px] flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="hidden h-4 w-32 lg:block" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                  <Skeleton className="hidden h-4 w-28 sm:block" />
                  <Skeleton className="hidden h-4 w-28 md:block" />
                </div>
              )}
            />
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ms-auto h-5 w-16 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="hidden gap-4 border-b border-border pb-2 sm:flex">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="hidden h-4 w-24 lg:block" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="hidden h-4 w-14 sm:block" />
              <Skeleton className="hidden h-4 w-14 md:block" />
            </div>
            <SkeletonRepeat
              count={earlierRowCount}
              render={(i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-3 border-b border-border/60 py-3 last:border-0"
                >
                  <Skeleton className="h-5 min-w-[120px] flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="hidden h-4 w-32 lg:block" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                  <Skeleton className="hidden h-4 w-28 sm:block" />
                  <Skeleton className="hidden h-4 w-28 md:block" />
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Separator className="opacity-50" />
      <Skeleton className="mx-auto h-3 w-full max-w-lg" />
    </div>
  );
}
