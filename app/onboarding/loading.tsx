import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function OnboardingLoading() {
  return (
    <div className="flex min-h-svh w-full flex-col bg-[var(--bg-canvas)]">
      <div className="flex items-center justify-between px-6 py-8 sm:px-10">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="flex flex-1 flex-col items-center gap-8 px-6 py-4 sm:px-10">
        <div className="flex w-full max-w-2xl gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-[3px] w-full rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        <div className="flex w-full max-w-2xl flex-1 flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-72" />
          </div>

          <Card className="w-full border-[var(--border)]/40 bg-[var(--bg-canvas)]/50 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <CardContent className="flex flex-col gap-7">
              <Skeleton className="h-4 w-full max-w-sm" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-11 w-full rounded-md sm:col-span-2" />
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
