import { Skeleton } from "@/components/shared/skeletons";
import { SkeletonRepeat } from "@/components/shared/skeleton-repeat";
import { cn } from "@/lib/utils";

const KPI_COUNT = 4;
const TAB_COUNT = 4;
const DEFAULT_ROW_COUNT = 8;

export type TasksPageSkeletonProps = {
  kpiCount?: number;
  tabCount?: number;
  rowCount?: number;
};

function SkeletonTaskKpi() {
  return (
    <div
      className={cn(
        "flex min-h-[88px] items-center justify-between gap-3",
        "rounded-[var(--radius-lg)] border border-border bg-card px-4 py-4 shadow-[var(--shadow-xs)]",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton w={72} h={12} r={3} />
        <Skeleton w={36} h={24} r={4} />
      </div>
      <Skeleton w={32} h={32} r={8} />
    </div>
  );
}

function SkeletonTaskTab({ width }: { width: number }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 px-3 py-2">
      <Skeleton w={width} h={14} r={3} />
      <Skeleton w={22} h={16} r={99} />
    </div>
  );
}

function SkeletonTasksTableRow() {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="tasks-table-cell w-10 ps-[18px] pe-0">
        <Skeleton variant="circle" w={16} h={16} />
      </td>
      <td className="tasks-table-cell min-w-[12rem]">
        <Skeleton w="72%" h={12} r={3} />
      </td>
      <td className="tasks-table-cell hidden min-w-[10rem] md:table-cell">
        <Skeleton w="55%" h={12} r={3} />
      </td>
      <td className="tasks-table-cell hidden sm:table-cell">
        <Skeleton w={88} h={22} r={99} />
      </td>
      <td className="tasks-table-cell hidden sm:table-cell">
        <Skeleton w={56} h={22} r={99} />
      </td>
      <td className="tasks-table-cell hidden lg:table-cell">
        <Skeleton w={64} h={12} r={3} />
      </td>
      <td className="tasks-table-cell w-12 pe-[18px] text-end">
        <Skeleton w={24} h={24} r={6} className="ms-auto" />
      </td>
    </tr>
  );
}

export function TasksPageSkeleton({
  kpiCount = KPI_COUNT,
  tabCount = TAB_COUNT,
  rowCount = DEFAULT_ROW_COUNT,
}: TasksPageSkeletonProps) {
  const tabWidths = [96, 80, 48, 104];

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading tasks"
      className="flex w-full flex-col"
    >
      {/* Page header — mirrors PageHeader + actions */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton w={88} h={30} r={4} />
          <Skeleton w="min(100%, 320px)" h={13} r={3} />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Skeleton w={132} h={30} r={6} />
          <Skeleton w={104} h={30} r={6} />
        </div>
      </div>

      {/* KPI strip — mirrors TasksSummaryStrip interactive tiles */}
      <div className="mb-[22px] grid gap-3 @sm/shell:grid-cols-2 @3xl/shell:grid-cols-4">
        <SkeletonRepeat
          count={kpiCount}
          render={(i) => <SkeletonTaskKpi key={i} />}
        />
      </div>

      {/* Project tabs + sort/filter — mirrors TaskFilters */}
      <div className="mb-5 flex items-center border-b border-border">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          <SkeletonRepeat
            count={tabCount}
            render={(i) => (
              <SkeletonTaskTab key={i} width={tabWidths[i % tabWidths.length] ?? 80} />
            )}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <Skeleton w={14} h={14} r={3} />
            <Skeleton w={60} h={14} r={3} />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2">
            <Skeleton w={14} h={14} r={3} />
            <Skeleton w={44} h={14} r={3} />
          </div>
        </div>
      </div>

      {/* Task table — mirrors bordered table card */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-xs)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="tasks-table-head w-10 ps-[18px] pe-0" aria-hidden>
                <span className="sr-only">Select</span>
              </th>
              <th className="tasks-table-head min-w-[12rem]" aria-hidden>
                <Skeleton w={40} h={10} r={2} />
              </th>
              <th
                className="tasks-table-head hidden md:table-cell"
                aria-hidden
              >
                <Skeleton w={48} h={10} r={2} />
              </th>
              <th
                className="tasks-table-head hidden sm:table-cell"
                aria-hidden
              >
                <Skeleton w={44} h={10} r={2} />
              </th>
              <th
                className="tasks-table-head hidden sm:table-cell"
                aria-hidden
              >
                <Skeleton w={48} h={10} r={2} />
              </th>
              <th
                className="tasks-table-head hidden lg:table-cell"
                aria-hidden
              >
                <Skeleton w={28} h={10} r={2} />
              </th>
              <th
                className="tasks-table-head w-12 pe-[18px] text-end"
                aria-hidden
              >
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <SkeletonRepeat
              count={rowCount}
              render={(i) => <SkeletonTasksTableRow key={i} />}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
