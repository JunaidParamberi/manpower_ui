import {
  SkeletonKPI,
  SkeletonChart,
  SkeletonTableRow,
  Skeleton,
  SkeletonListRow,
} from "@/components/shared/skeletons";
import { SkeletonRepeat } from "@/components/shared/skeleton-repeat";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const FINANCE_KPI_COUNT = 4;
const FINANCE_PRESET_COUNT = 3;

export type FinancePageSkeletonProps = {
  invoiceRowCount?: number;
  kpiCount?: number;
  presetCount?: number;
};

export function FinancePageSkeleton({
  invoiceRowCount = 0,
  kpiCount = FINANCE_KPI_COUNT,
  presetCount = FINANCE_PRESET_COUNT,
}: FinancePageSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading finance"
      className="flex flex-col gap-6"
    >
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton w={112} h={10} r={3} />
          <Skeleton w={144} h={30} r={4} />
          <Skeleton w={320} h={14} r={4} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5">
            <SkeletonRepeat
              count={presetCount}
              render={(i) => <Skeleton key={i} w={88} h={30} r={9999} className="mx-0.5" />}
            />
          </div>
          <Skeleton w={88} h={30} r={6} />
          <Skeleton w={104} h={30} r={6} />
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 @3xl/shell:grid-cols-4">
        <SkeletonRepeat count={kpiCount} render={(i) => <SkeletonKPI key={i} />} />
      </div>

      {/* Revenue chart + client breakdown */}
      <div className="grid gap-4 @5xl/shell:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <Skeleton w={136} h={14} r={3} />
            <Skeleton w={160} h={10} r={3} className="mt-2" />
          </CardHeader>
          <CardContent className="pt-4">
            <SkeletonChart height={220} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <Skeleton w={144} h={14} r={3} />
            <Skeleton w={132} h={10} r={3} className="mt-2" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col divide-y divide-border/50">
              <SkeletonRepeat
                count={5}
                render={(i) => <SkeletonListRow key={i} withAvatar={false} />}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice table */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton w={80} h={16} r={3} />
              <Skeleton w={220} h={10} r={3} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton w={220} h={26} r={9999} />
              <Skeleton w={224} h={32} r={6} />
              <Skeleton w={88} h={26} r={6} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-4 py-2.5">
            {[64, 80, 64, 56, 64].map((w, i) => (
              <Skeleton key={i} w={w} h={10} r={3} className={i === 4 ? "ml-auto" : ""} />
            ))}
          </div>
          <table className="w-full">
            <tbody>
              <SkeletonRepeat
                count={invoiceRowCount}
                render={(i) => <SkeletonTableRow key={i} cols={5} />}
              />
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
