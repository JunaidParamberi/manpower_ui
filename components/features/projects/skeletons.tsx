import { FormPageShell } from "@/components/shared/form-page-shell";
import { WorkspaceFormSkeleton } from "@/components/shared/workspace-form-skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/shared/skeletons";
import { cn } from "@/lib/utils";
import { SkeletonRepeat } from "@/components/shared/skeleton-repeat";

export type ProjectsPageSkeletonProps = {
  rowCount?: number;
  statusChipCount?: number;
};

export function ProjectsPageSkeleton({
  rowCount = 0,
  statusChipCount = 4,
}: ProjectsPageSkeletonProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton w={176} h={36} r={4} />
          <Skeleton w="100%" h={16} r={3} className="max-w-lg" />
        </div>
        <Skeleton w="9.5rem" h={36} r={6} className="shrink-0" />
      </div>
      <Card className="overflow-hidden border border-border">
        <CardHeader className="flex flex-col gap-4 border-b border-border/80 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton w="100%" h={36} r={6} className="max-w-md" />
            <Skeleton w="7rem" h={36} r={6} className="w-full sm:w-28" />
          </div>
          <div className="flex flex-wrap gap-2">
            <SkeletonRepeat
              count={statusChipCount}
              render={(i) => <Skeleton key={i} w={112} h={32} r={9999} />}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b border-border py-3 ps-4 pe-4 sm:ps-6 sm:pe-6">
            <Skeleton w={80} h={12} r={3} className="flex-1 max-w-[120px]" />
            <Skeleton w={56} h={12} r={3} className="hidden md:block" />
            <Skeleton w={56} h={12} r={3} />
            <Skeleton w={64} h={12} r={3} className="hidden sm:block" />
            <div className="w-12" />
          </div>
          {/* Table rows */}
          <SkeletonRepeat
            count={rowCount}
            render={(i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-border py-4 ps-4 pe-4 last:border-0 sm:ps-6 sm:pe-6"
              >
                <Skeleton
                  w="100%"
                  h={16}
                  r={3}
                  className="min-w-0 flex-1 max-w-[220px]"
                />
                <Skeleton w={112} h={16} r={3} className="hidden md:block" />
                <Skeleton w={80} h={24} r={9999} />
                <Skeleton w={96} h={16} r={3} className="hidden sm:block" />
                <div className="flex w-12 justify-end">
                  <Skeleton w={32} h={32} r={9999} />
                </div>
              </div>
            )}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-border/80 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton w={208} h={16} r={3} />
          <div className="flex gap-2">
            <Skeleton w={32} h={32} r={6} />
            <Skeleton w={32} h={32} r={6} />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export function ProjectNewPageSkeleton() {
  return (
    <FormPageShell maxWidth="7xl">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton w={112} h={32} r={6} />
          <Skeleton w={208} h={40} r={6} />
          <Skeleton w="100%" h={16} r={4} className="max-w-lg" />
        </div>
        <WorkspaceFormSkeleton variant="project" />
      </div>
    </FormPageShell>
  );
}

export function ProjectEditPageSkeleton() {
  return <ProjectNewPageSkeleton />;
}

/** The focus workspace while a project loads — same blocks as the real one. */
export function ProjectFocusSkeleton({
  withHeader = true,
  delayed = false,
}: {
  /** Off when the page already shows the project's header. */
  withHeader?: boolean;
  /** Fade in only if loading takes a moment, so quick switches don't flash. */
  delayed?: boolean;
} = {}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading project"
      className={cn("flex flex-col gap-4", delayed && "animate-[skeleton-in_180ms_ease-out_120ms_both] motion-reduce:animate-none")}
    >
      {withHeader ? (
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2.5">
          <Skeleton w={260} h={24} r={5} />
          <div className="flex items-center gap-3.5">
            <Skeleton w={56} h={12} r={4} />
            <Skeleton w={110} h={12} r={4} />
            <Skeleton w={70} h={12} r={4} />
          </div>
        </div>
        <div className="flex gap-1.5">
          <Skeleton w={84} h={28} r={9999} />
          <Skeleton w={86} h={28} r={8} />
          <Skeleton w={78} h={28} r={8} />
        </div>
      </div>
      ) : null}
      <div className="flex flex-col rounded-xl border border-border bg-card px-4 pt-3.5 pb-3 shadow-[var(--shadow-xs)]">
        <div className="mb-3 flex justify-between">
          <Skeleton w={90} h={14} r={4} />
          <Skeleton w={60} h={12} r={4} />
        </div>
        <Skeleton w="100%" h={8} r={9999} />
        <div className="mt-2 flex justify-between">
          <Skeleton w={60} h={11} r={4} />
          <Skeleton w={60} h={11} r={4} />
        </div>
        <div className="mt-2.5 flex gap-3.5">
          <Skeleton w={70} h={11} r={4} />
          <Skeleton w={70} h={11} r={4} />
          <Skeleton w={80} h={11} r={4} />
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-y-3 border-t border-border pt-3 @lg/shell:grid-cols-4">
          <SkeletonRepeat
            count={4}
            render={(i) => (
              <div key={i} className="flex flex-col gap-1.5 pe-3">
                <Skeleton w={48} h={11} r={4} />
                <Skeleton w={72} h={15} r={4} />
              </div>
            )}
          />
        </div>
      </div>
      <div className="flex h-[34px] items-center gap-5 px-2.5 shadow-[inset_0_-1px_0_var(--border)]">
        {[44, 58, 72, 34, 62].map((w, i) => (
          <Skeleton key={i} w={w} h={13} r={4} />
        ))}
      </div>
      <div className="flex flex-col">
        <div className="flex h-7 items-center"><Skeleton w={56} h={11} r={4} /></div>
        {[62, 48, 55].map((w, i) => (
          <div key={i} className="flex h-9 items-center gap-2.5">
            <Skeleton w={16} h={16} r={9999} />
            <Skeleton w={`${w}%`} h={13} r={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** /projects/[id] while loading: back link, title block, summary card, tabs and task rows. */
export function ProjectDetailPageSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading project" className="mx-auto flex w-full max-w-[1120px] flex-col gap-5">
      <Skeleton w={88} h={13} r={4} />
      <div className="flex flex-col gap-2">
        <Skeleton w={260} h={24} r={5} />
        <div className="flex gap-3">
          <Skeleton w={64} h={12} r={4} />
          <Skeleton w={120} h={12} r={4} />
          <Skeleton w={80} h={12} r={4} />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 pt-3.5 pb-4 shadow-[var(--shadow-xs)]">
        <div className="flex justify-between">
          <Skeleton w={110} h={13} r={4} />
          <Skeleton w={180} h={12} r={4} />
        </div>
        <Skeleton w="100%" h={8} r={9999} />
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
          <SkeletonRepeat
            count={4}
            render={(i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton w={52} h={11} r={4} />
                <Skeleton w={80} h={14} r={4} />
              </div>
            )}
          />
        </div>
      </div>
      <div className="flex gap-4 border-b border-border pb-2.5">
        <SkeletonRepeat count={5} render={(i) => <Skeleton key={i} w={68} h={13} r={4} />} />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <SkeletonRepeat
          count={4}
          render={(i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl bg-[var(--bg-subtle)]/55 p-2">
              <Skeleton w={80} h={13} r={4} className="m-1" />
              <Skeleton w="100%" h={72} r={10} />
              {i % 2 === 0 ? <Skeleton w="100%" h={72} r={10} /> : null}
            </div>
          )}
        />
      </div>
    </div>
  );
}

/* ── Projects portfolio skeletons ─────────────────────────────────────────
 * Built from the same containers and measurements as ProjectsPage and its
 * views, so loading → loaded never shifts the layout.
 */

function PortfolioListRowsSkeleton() {
  return (
    <>
      {[3, 2].map((rows, g) => (
        <section key={g} className="mt-1.5 first:mt-0">
          <div className="flex h-8 items-center gap-1.5">
            <Skeleton w={64} h={11} r={4} />
          </div>
          <div className="-mx-2.5 flex flex-col gap-0.5">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-[10px] px-2.5 pt-2.5 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton w={`${62 - i * 9}%`} h={13} r={4} />
                  <Skeleton w={64} h={11} r={4} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton w={14} h={14} r={4} />
                  <Skeleton w={96} h={11} r={4} />
                </div>
                <Skeleton w="100%" h={4} r={9999} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function PortfolioBoardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 items-start gap-3 overflow-hidden px-4 pt-5 pb-6 sm:px-6 lg:px-7">
      {[2, 3, 1, 1].map((cards, c) => (
        <div key={c} className="flex w-[272px] shrink-0 flex-col gap-1.5 rounded-[var(--surface-radius)] bg-[var(--bg-subtle)]/55 p-1.5">
          <div className="flex h-[30px] items-center gap-1.5 px-1.5">
            <Skeleton w={8} h={8} r={2} />
            <Skeleton w={64} h={13} r={4} />
          </div>
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className="flex flex-col gap-2.5 rounded-[10px] border border-border bg-card px-3 pt-2.5 pb-3">
              <Skeleton w="72%" h={13} r={4} />
              <div className="flex items-center gap-1.5">
                <Skeleton w={14} h={14} r={4} />
                <Skeleton w={90} h={11} r={4} />
              </div>
              <Skeleton w="100%" h={4} r={9999} />
              <div className="flex justify-between">
                <Skeleton w={70} h={11} r={4} />
                <Skeleton w={52} h={11} r={4} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function PortfolioTimelineSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <div className="grid h-[38px] grid-cols-[248px_minmax(0,1fr)] border-b border-border">
        <div className="flex items-center ps-7"><Skeleton w={70} h={11} r={4} /></div>
        <div className="grid grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-start border-s border-border ps-2 pt-[9px]"><Skeleton w={28} h={11} r={4} /></div>
          ))}
        </div>
      </div>
      {[[8, 30], [22, 40], [35, 28], [50, 30], [60, 25]].map(([left, width], i) => (
        <div key={i} className="grid h-12 grid-cols-[248px_minmax(0,1fr)] border-b border-border">
          <div className="flex flex-col justify-center gap-1.5 ps-7 pe-4">
            <Skeleton w="70%" h={13} r={4} />
            <Skeleton w="45%" h={11} r={4} />
          </div>
          <div className="relative">
            <span
              className="absolute top-[13px] h-[22px] rounded-md bg-[var(--bg-subtle)]"
              // Placeholder geometry.
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const SKELETON_BLOCK =
  "flex min-h-0 min-w-0 flex-col lg:overflow-hidden";

function ChipsSkeleton() {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      {[38, 82, 58, 70, 48].map((w, i) => (
        <Skeleton key={i} w={w} h={26} r={9999} className="shrink-0" />
      ))}
    </div>
  );
}

/** Loading state for /projects — the same blocks as the page, in the remembered view. */
export function ProjectsPortfolioSkeleton({ view = "list" }: { view?: "list" | "board" | "timeline" }) {
  return (
    <div
      data-page-fullbleed
      role="status"
      aria-busy="true"
      aria-label="Loading projects"
      className="flex min-h-0 flex-col lg:h-[calc(100dvh-var(--topbar-h)-var(--shell-inset))] lg:flex-row"
    >
      {view === "list" ? (
        <>
          <div className={`${SKELETON_BLOCK} w-full lg:w-[360px] lg:shrink-0 lg:border-r lg:border-border`}>
            <div className="flex flex-col gap-3 border-b border-border px-4 pt-4 pb-3.5 sm:px-6 lg:px-7 lg:pt-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1.5">
                  <Skeleton w={84} h={18} r={5} />
                  <Skeleton w={150} h={11} r={4} />
                </div>
                <div className="flex gap-1.5">
                  <Skeleton w={92} h={30} r={8} />
                  <Skeleton w={28} h={28} r={8} />
                  <Skeleton w={28} h={28} r={8} />
                </div>
              </div>
              <Skeleton w="100%" h={32} r={8} />
              <ChipsSkeleton />
            </div>
            <div className="overflow-hidden px-4 pt-2 pb-6 sm:px-6 lg:px-7">
              <PortfolioListRowsSkeleton />
            </div>
          </div>
          <div className={`${SKELETON_BLOCK} hidden flex-1 lg:flex`}>
            <div className="flex w-full flex-col px-7 pt-6 pb-10">
              <ProjectFocusSkeleton />
            </div>
          </div>
        </>
      ) : (
        <div className={`${SKELETON_BLOCK} flex-1`}>
          <div className="flex items-center gap-3 border-b border-border px-4 pt-4 pb-3.5 sm:px-6 lg:px-7 lg:pt-6">
            <Skeleton w={84} h={18} r={5} className="shrink-0" />
            <div className="min-w-0 flex-1"><ChipsSkeleton /></div>
            <Skeleton w={240} h={32} r={8} className="hidden shrink-0 sm:block" />
            <Skeleton w={92} h={30} r={8} className="shrink-0" />
            <Skeleton w={64} h={28} r={8} className="shrink-0" />
          </div>
          {view === "board" ? <PortfolioBoardSkeleton /> : <PortfolioTimelineSkeleton />}
        </div>
      )}
    </div>
  );
}
