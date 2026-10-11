import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  WorkspaceFormAside,
  WorkspaceFormMain,
  WorkspaceFormShell,
} from "@/components/shared/workspace-form-shell";

type WorkspaceFormSkeletonProps = {
  variant: "client" | "project";
};

type SectionSkeletonProps = {
  titleWidth: string;
  descriptionWidth: string;
  rows: Array<"full" | "half" | "textarea" | "choice">;
};

function FieldSkeleton({ span = "half" }: { span?: "full" | "half" | "textarea" }) {
  return (
    <div className={span === "full" || span === "textarea" ? "flex flex-col gap-2 md:col-span-2" : "flex flex-col gap-2"}>
      <Skeleton className="h-4 w-28 rounded-sm" />
      <Skeleton
        className={
          span === "textarea" ? "min-h-24 w-full rounded-md" : "h-9 w-full rounded-md"
        }
      />
      {span === "full" ? <Skeleton className="h-3 w-3/5 rounded-sm" /> : null}
    </div>
  );
}

function WorkspaceFormSectionSkeleton({
  titleWidth,
  descriptionWidth,
  rows,
}: SectionSkeletonProps) {
  return (
    <Card className="border border-border shadow-sm ring-1 ring-border">
      <CardHeader className="border-b border-border pb-4">
        <Skeleton className={`h-5 ${titleWidth} rounded-sm`} />
        <Skeleton className={`h-4 ${descriptionWidth} max-w-full rounded-sm`} />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row, index) => {
            if (row === "choice") {
              return (
                <div key={`${row}-${index}`} className="flex flex-col gap-3 md:col-span-2">
                  <Skeleton className="h-4 w-36 rounded-sm" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                </div>
              );
            }

            return <FieldSkeleton key={`${row}-${index}`} span={row} />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkspaceInsightSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card size="sm" className="border border-border shadow-xs">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32 rounded-sm" />
              <Skeleton className="h-3 w-48 max-w-full rounded-sm" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted p-4">
              <Skeleton className="h-6 w-48 max-w-full rounded-sm" />
              <Skeleton className="mt-2 h-3 w-24 rounded-sm" />
            </div>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-start gap-2">
                <Skeleton className="mt-0.5 size-4 rounded-sm" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-28 rounded-sm" />
                  <Skeleton className="h-3 w-4/5 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="border border-border shadow-xs">
        <CardHeader className="pb-0">
          <Skeleton className="h-4 w-32 rounded-sm" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-2/3 rounded-sm" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-4/5 rounded-sm" />
              <Skeleton className="h-4 w-3/5 rounded-sm" />
              <Skeleton className="h-4 w-2/3 rounded-sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function WorkspaceFormSkeleton({ variant }: WorkspaceFormSkeletonProps) {
  const sections =
    variant === "client"
      ? [
          {
            titleWidth: "w-36",
            descriptionWidth: "w-3/4",
            rows: ["choice", "full", "half", "half", "full"],
          },
          {
            titleWidth: "w-32",
            descriptionWidth: "w-2/3",
            rows: ["full", "half", "half", "half", "half"],
          },
          {
            titleWidth: "w-36",
            descriptionWidth: "w-3/4",
            rows: ["half", "half", "half", "half", "textarea"],
          },
          {
            titleWidth: "w-32",
            descriptionWidth: "w-3/5",
            rows: ["half", "half", "textarea"],
          },
        ]
      : [
          {
            titleWidth: "w-32",
            descriptionWidth: "w-2/3",
            rows: ["half", "half", "full"],
          },
          {
            titleWidth: "w-20",
            descriptionWidth: "w-3/4",
            rows: ["half", "half"],
          },
          {
            titleWidth: "w-24",
            descriptionWidth: "w-2/3",
            rows: ["half", "half"],
          },
        ];

  return (
    <WorkspaceFormShell>
      <WorkspaceFormMain>
        {sections.map((section, index) => (
          <WorkspaceFormSectionSkeleton
            key={index}
            titleWidth={section.titleWidth}
            descriptionWidth={section.descriptionWidth}
            rows={section.rows as SectionSkeletonProps["rows"]}
          />
        ))}
        <WorkspaceFormSectionSkeleton
          titleWidth={variant === "client" ? "w-32" : "w-36"}
          descriptionWidth="w-3/5"
          rows={["full"]}
        />
      </WorkspaceFormMain>

      <WorkspaceFormAside>
        <WorkspaceInsightSkeleton />
      </WorkspaceFormAside>
    </WorkspaceFormShell>
  );
}
