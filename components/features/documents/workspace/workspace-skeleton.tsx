import { Skeleton } from "@/components/ui/skeleton";

const RailSkeleton = () => (
  <div aria-hidden>
    {[3, 3, 2, 3].map((rows, s) => (
      <div key={s} className="flex flex-col gap-1.5 border-b border-border px-3.5 pt-3.5 pb-3 last:border-b-0">
        <Skeleton className="mb-1.5 ml-1 h-3 w-16" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex min-h-9 items-center justify-between px-2">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

/** Loading state of a document page: header, readiness line, a paper and the settings rail. */
export function WorkspaceSkeleton({ withRail = true }: { withRail?: boolean }) {
  return (
    <div data-doc-workspace role="status" aria-label="Loading document" className="flex min-h-0 flex-1 flex-col lg:h-full">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-[22px] w-14 rounded-full" />
        <span className="flex-1" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3.5 overflow-hidden bg-[var(--bg-sunken)] pt-4 sm:px-6 sm:pt-7">
          <Skeleton className="h-3.5 w-72 max-w-full" />
          <div className="w-full max-w-[800px] rounded-md bg-[var(--bg-surface)] px-6 py-10 shadow-[var(--shadow-xs)] sm:px-16 sm:pt-14">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-[10px]" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-7">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-4">
              <Skeleton className="h-2.5 w-full" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between gap-6 border-b border-border/60 pb-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <div className="mt-8 ml-auto flex w-60 flex-col gap-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        </div>
        {withRail ? (
          <aside className="hidden w-[300px] shrink-0 overflow-hidden border-l border-border bg-[var(--panel)] lg:block">
            <RailSkeleton />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
