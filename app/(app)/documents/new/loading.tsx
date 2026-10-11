import { Skeleton } from "@/components/ui/skeleton";

export default function NewDocumentLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 sm:p-7" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[68px] rounded-[var(--surface-radius)]" />
        ))}
      </div>
    </div>
  );
}
