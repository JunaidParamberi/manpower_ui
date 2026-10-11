import { Skeleton } from "@/components/ui/skeleton";

export default function RecurringLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
