import { FormPageShell } from "@/components/shared/form-page-shell";
import { WorkspaceFormSkeleton } from "@/components/shared/workspace-form-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRepeat } from "@/components/shared/skeleton-repeat";
import { cn } from "@/lib/utils";

/** Mirror design tokens: xs 4 · sm 6 · md 8 */
const R_TEXT_XS = "rounded-[4px]";
const R_TEXT_SM = "rounded-[6px]";
const R_CONTROL = "rounded-md";
const R_STATUS = "rounded-full";

/** Same inset as every refined clients section (the app bar's 28px on desktop). */
const INSET = "px-4 sm:px-6 lg:px-7";
const TAB_WIDTHS = ["w-16", "w-[60px]", "w-[76px]", "w-14", "w-11"];

export function ClientNewPageSkeleton() {
  return (
    <FormPageShell maxWidth="7xl">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className={cn("h-8 w-28", R_CONTROL)} />
          <Skeleton className={cn("h-9 w-48 md:h-10 md:w-52", R_TEXT_SM)} />
          <Skeleton className={cn("h-4 w-full max-w-lg", R_TEXT_SM)} />
        </div>
        <WorkspaceFormSkeleton variant="client" />
      </div>
    </FormPageShell>
  );
}

function SectionSkeleton({ rows, titleWidth }: { rows: number; titleWidth: string }) {
  return (
    <div className={cn("min-w-0 pt-5", INSET)}>
      <div className="mb-1 flex items-center justify-between py-1">
        <Skeleton className={cn("h-3.5", titleWidth, R_TEXT_XS)} />
        <Skeleton className={cn("h-3 w-12", R_TEXT_XS)} />
      </div>
      <div className="divide-y divide-border">
        <SkeletonRepeat
          count={rows}
          render={(i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <Skeleton className={cn("size-7 shrink-0", R_CONTROL)} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className={cn("h-3.5 w-32", R_TEXT_XS)} />
                <Skeleton className={cn("h-3 w-44 max-w-full", R_TEXT_XS)} />
              </div>
              <Skeleton className={cn("h-3.5 w-16 shrink-0", R_TEXT_XS)} />
            </div>
          )}
        />
      </div>
    </div>
  );
}

/** Client detail while it loads: header, money strip, tabs and the Overview body. */
export function ClientDetailSkeleton() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col" aria-busy="true" aria-label="Loading client">
      <div className={cn("flex items-start gap-3.5 pt-4 pb-4 lg:pt-6", INSET)}>
        <Skeleton className="size-10 shrink-0 rounded-[10px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
          <Skeleton className={cn("h-5 w-48 max-w-full", R_TEXT_SM)} />
          <Skeleton className={cn("h-3 w-72 max-w-full", R_TEXT_XS)} />
        </div>
        <div className="hidden shrink-0 gap-1.5 sm:flex">
          <Skeleton className={cn("h-7 w-16", R_CONTROL)} />
          <Skeleton className={cn("h-7 w-16", R_CONTROL)} />
          <Skeleton className={cn("h-7 w-24", R_CONTROL)} />
        </div>
      </div>
      <div className="grid grid-cols-2 border-y border-border @3xl/shell:grid-cols-4">
        <SkeletonRepeat
          count={4}
          render={(i) => (
            <div
              key={i}
              className={cn(
                "flex min-w-0 flex-col gap-1.5 py-3.5",
                INSET,
                i % 2 === 0 && "border-r border-border",
                i < 2 && "border-b border-border @3xl/shell:border-b-0",
                i === 1 && "@3xl/shell:border-r",
              )}
            >
              <Skeleton className={cn("h-2.5 w-14", R_TEXT_XS)} />
              <Skeleton className={cn("h-5 w-24", R_TEXT_SM)} />
              <Skeleton className={cn("h-3 w-20", R_TEXT_XS)} />
            </div>
          )}
        />
      </div>
      <div className={cn("flex h-[38px] items-center gap-5 shadow-[inset_0_-1px_0_var(--border)]", INSET)}>
        {TAB_WIDTHS.map((w) => (
          <Skeleton key={w} className={cn("h-3.5", w, R_TEXT_XS)} />
        ))}
      </div>
      <div className="mx-4 mt-5 flex flex-col overflow-hidden rounded-xl border border-border sm:mx-6 lg:mx-7">
        <div className="flex min-h-[46px] items-center gap-2.5 px-4">
          <Skeleton className={cn("size-[26px]", R_STATUS)} />
          <Skeleton className={cn("h-3.5 w-28", R_TEXT_XS)} />
        </div>
        <div className="flex flex-col gap-1.5 border-t border-border px-4 py-3">
          <Skeleton className={cn("h-3.5 w-56 max-w-full", R_TEXT_XS)} />
          <Skeleton className={cn("h-3 w-72 max-w-full", R_TEXT_XS)} />
        </div>
      </div>
      <div className="grid min-w-0 @3xl/shell:grid-cols-2">
        <SectionSkeleton rows={2} titleWidth="w-28" />
        <SectionSkeleton rows={2} titleWidth="w-32" />
      </div>
    </div>
  );
}

export type ClientsListPaneSkeletonProps = {
  rowCount?: number;
};

/** Clients list pane while it loads: same header, search, chips and row geometry as ClientsListPane. */
export function ClientsListPaneSkeleton({ rowCount = 6 }: ClientsListPaneSkeletonProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col" aria-busy="true" aria-label="Loading clients">
      <div className={cn("flex shrink-0 flex-col gap-3 border-b border-border pt-4 pb-3.5 lg:pt-6", INSET)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Skeleton className={cn("h-[18px] w-20", R_TEXT_SM)} />
            <Skeleton className={cn("h-3 w-48", R_TEXT_XS)} />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Skeleton className={cn("size-7", R_CONTROL)} />
            <Skeleton className={cn("size-7", R_CONTROL)} />
          </div>
        </div>
        <Skeleton className={cn("h-8 w-full", R_CONTROL)} />
        <div className="flex items-center gap-1">
          {["w-12", "w-24", "w-20", "w-24"].map((w, i) => (
            <Skeleton key={`${w}-${i}`} className={cn("h-[26px]", w, R_STATUS)} />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden pt-1.5">
        <SkeletonRepeat
          count={rowCount}
          render={(i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 ps-4 pe-3 sm:ps-6 sm:pe-5 lg:ps-7">
              <Skeleton className={cn("size-7 shrink-0", R_CONTROL)} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className={cn("h-3.5 w-36", R_TEXT_XS)} />
                <Skeleton className={cn("h-3 w-28", R_TEXT_XS)} />
              </div>
              <Skeleton className={cn("size-[26px] shrink-0", R_STATUS)} />
            </div>
          )}
        />
      </div>
    </div>
  );
}

export type ClientsMasterDetailSkeletonProps = {
  rowCount?: number;
};

/** Full split preview for Storybook. Route loading uses ClientDetailSkeleton only (the shell already renders the real list pane). */
export function ClientsMasterDetailSkeleton({ rowCount = 6 }: ClientsMasterDetailSkeletonProps) {
  return (
    <div
      data-page-fullbleed
      className="flex min-h-0 flex-col lg:h-[calc(100dvh-var(--topbar-h)-var(--shell-inset))] lg:flex-row"
    >
      <section className="flex min-h-0 w-full min-w-0 flex-col lg:w-[360px] lg:shrink-0 lg:overflow-hidden lg:border-r lg:border-border">
        <ClientsListPaneSkeleton rowCount={rowCount} />
      </section>
      <section className="hidden min-h-0 min-w-0 flex-1 flex-col lg:flex lg:overflow-hidden">
        <ClientDetailSkeleton />
      </section>
    </div>
  );
}
