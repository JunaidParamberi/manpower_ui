import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function SettingsSectionCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <Skeleton className="mt-0.5 size-9 shrink-0 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-full max-w-[220px]" />
        </div>
        <Skeleton className="mt-0.5 size-4 shrink-0 rounded-sm" />
      </CardHeader>
    </Card>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-36 md:h-10 md:w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SettingsSectionCardSkeleton />
      </div>
    </div>
  );
}

function BrandKitFieldCardSkeleton({
  titleWidth,
  descriptionWidth,
  children,
}: {
  titleWidth: string;
  descriptionWidth: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-1.5 pb-4">
        <Skeleton className={titleWidth} />
        <Skeleton className={descriptionWidth} />
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function BrandKitColorFieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 min-w-0 flex-1 rounded-md" />
        <Skeleton className="size-9 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

function BrandKitPreviewSkeleton() {
  return (
    <div className="sticky top-6 flex flex-col gap-2">
      <Skeleton className="h-3 w-16" />
      <Card className="overflow-hidden shadow-sm ring-1 ring-border/60">
        <div className="flex flex-col">
          <Skeleton className="h-1 w-full rounded-none" />
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="size-10 shrink-0 rounded-md" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-2 w-3/4 rounded-full" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-1.5 w-5/6 rounded-full" />
              <Skeleton className="h-1.5 w-2/3 rounded-full" />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-1.5 w-16 rounded-full" />
                <Skeleton className="h-1.5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </CardContent>
        </div>
      </Card>
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export function SettingsBrandPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-40 md:h-10 md:w-44" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-4">
            <BrandKitFieldCardSkeleton
              titleWidth="h-5 w-12"
              descriptionWidth="h-3 w-full max-w-xs"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="min-h-[10.5rem] w-full rounded-lg" />
              </div>
            </BrandKitFieldCardSkeleton>

            <BrandKitFieldCardSkeleton
              titleWidth="h-5 w-16"
              descriptionWidth="h-3 w-full max-w-sm"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <BrandKitColorFieldSkeleton />
                <BrandKitColorFieldSkeleton />
              </div>
            </BrandKitFieldCardSkeleton>

            <BrandKitFieldCardSkeleton
              titleWidth="h-5 w-24"
              descriptionWidth="h-3 w-full max-w-xs"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </BrandKitFieldCardSkeleton>

            <BrandKitFieldCardSkeleton
              titleWidth="h-5 w-32"
              descriptionWidth="h-3 w-full max-w-sm"
            >
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="min-h-[120px] w-full rounded-md" />
              </div>
            </BrandKitFieldCardSkeleton>
          </div>

          <div className="hidden lg:block">
            <BrandKitPreviewSkeleton />
          </div>
        </div>

        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );
}
