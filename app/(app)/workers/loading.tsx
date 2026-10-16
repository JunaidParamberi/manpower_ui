import { Skeleton, SkeletonTable } from "@/components/shared/skeletons";

export default function WorkersLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton w={210} h={26} r={6} />
          <Skeleton w={250} h={13} r={4} />
        </div>
        <Skeleton w={130} h={30} r={6} />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton w="100%" h={44} r={6} className="max-w-sm" />
        <div className="overflow-hidden rounded-lg border border-border/80">
          <SkeletonTable
            rows={6}
            cols={6}
            headers={["Employee ID", "Name", "Nationality", "Trade", "Supplier", "Status"]}
          />
        </div>
      </div>
    </div>
  );
}
