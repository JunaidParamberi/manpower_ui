import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRepeat } from "@/components/shared/skeleton-repeat";

export type DocumentsTableSkeletonProps = {
  rowCount?: number;
};

export function DocumentsPageSkeleton({ rowCount = 6 }: DocumentsTableSkeletonProps) {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <Skeleton className="h-9 w-9 sm:w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <div className="mb-6 flex items-center overflow-x-auto border-b border-border">
        <div className="flex min-w-max items-center gap-0">
          {[48, 88, 72, 104, 156].map((width, index) => (
            <div key={index} className="px-4 py-2.5">
              <Skeleton className="h-5" style={{ width }} />
            </div>
          ))}
        </div>
      </div>

      <TemplateCardsSkeleton />

      <div className="flex flex-col gap-3">
        <DocumentsTableSkeleton rowCount={rowCount || 6} />
      </div>
    </div>
  );
}

function TemplateCardsSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="mb-3 h-3 w-36" />
      <div className="grid grid-cols-2 gap-3 @3xl/shell:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-[120px] flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentsTableSkeleton({ rowCount = 6 }: DocumentsTableSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[680px] text-sm" aria-label="Loading documents">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-2.5 text-left sm:px-6">
              <Skeleton className="h-3 w-16" />
            </th>
            <th className="hidden px-4 py-2.5 text-left md:table-cell">
              <Skeleton className="h-3 w-12" />
            </th>
            <th className="hidden px-4 py-2.5 text-left lg:table-cell">
              <Skeleton className="h-3 w-12" />
            </th>
            <th className="hidden px-4 py-2.5 text-left lg:table-cell">
              <Skeleton className="h-3 w-8" />
            </th>
            <th className="px-4 py-2.5">
              <Skeleton className="ms-auto h-3 w-14" />
            </th>
            <th className="px-4 py-2.5 text-left">
              <Skeleton className="h-3 w-14" />
            </th>
            <th className="w-10 pe-4 sm:pe-6" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          <SkeletonRepeat
            count={rowCount || 6}
            render={(i) => (
              <tr key={i}>
                <td className="px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="hidden h-5 w-9 rounded-md sm:block" />
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32 md:hidden" />
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="ms-auto h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="size-2 rounded-full" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                </td>
                <td className="py-3 pe-4 sm:pe-6">
                  <Skeleton className="size-7 rounded-md" />
                </td>
              </tr>
            )}
          />
        </tbody>
      </table>
    </div>
  );
}

export function DocumentEditorSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>

      <div className="grid gap-6 @3xl/shell:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border/70 bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex flex-col gap-3 md:hidden">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="rounded-xl border border-border p-3">
                  <div className="flex items-start gap-2">
                    <Skeleton className="h-9 flex-1 rounded-md" />
                    <Skeleton className="size-9 rounded-md" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {Array.from({ length: 3 }, (_, field) => (
                      <div key={field} className="flex flex-col gap-1">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-9 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-md border border-border md:block">
              <div className="grid grid-cols-[minmax(180px,1fr)_80px_112px_80px_112px_40px] border-b border-border bg-muted/40">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="px-3 py-2">
                    {index < 5 ? <Skeleton className="h-3 w-16" /> : null}
                  </div>
                ))}
              </div>
              {Array.from({ length: 4 }, (_, row) => (
                <div
                  key={row}
                  className="grid grid-cols-[minmax(180px,1fr)_80px_112px_80px_112px_40px] border-b border-border last:border-b-0"
                >
                  <div className="px-2 py-1.5"><Skeleton className="h-8 w-full" /></div>
                  <div className="px-2 py-1.5"><Skeleton className="h-8 w-full" /></div>
                  <div className="px-2 py-1.5"><Skeleton className="h-8 w-full" /></div>
                  <div className="px-2 py-1.5"><Skeleton className="h-8 w-full" /></div>
                  <div className="px-3 py-1.5"><Skeleton className="ms-auto h-4 w-16" /></div>
                  <div className="px-2 py-1.5"><Skeleton className="mx-auto size-7" /></div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Skeleton className="h-8 w-28" />
              <div className="flex w-full flex-col gap-2 sm:min-w-48 sm:w-auto">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
        </div>

        <aside>
          <div className="rounded-xl border border-border/70 bg-card">
            <div className="px-6 pb-3 pt-6">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-col gap-4 px-6 pb-6">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
        <Skeleton className="h-[30px] w-20 rounded-md" />
        <Skeleton className="h-[30px] w-28 rounded-md" />
      </div>
    </div>
  );
}

export type TemplatePickerSkeletonProps = {
  templateCount?: number;
};

export function TemplatePickerSkeleton({
  templateCount = 0,
}: TemplatePickerSkeletonProps) {
  const cardCount = Math.max(templateCount, 3);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BlankTemplateCardSkeleton />
          <SkeletonRepeat
            count={cardCount}
            render={(i) => <TemplateCardSkeleton key={i} />}
          />
        </div>
      </section>

      {templateCount > 3 ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonRepeat
              count={Math.min(templateCount - 3, 3)}
              render={(i) => <TemplateCardSkeleton key={i} />}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BlankTemplateCardSkeleton() {
  return (
    <div className="flex aspect-[5/4] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

function TemplateCardSkeleton() {
  return (
    <div className="flex aspect-[5/4] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex-1 bg-muted/30 px-5 pb-3 pt-5">
        <Skeleton className="h-5 w-36" />
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-8/12" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-background/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-1.5 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function DocumentDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <DocumentHeaderSkeleton />
      <InvoicePaperSkeleton />
      <PaymentHistorySkeleton />
    </div>
  );
}

function DocumentHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-2" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

function InvoicePaperSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border/60 bg-card p-3 shadow-sm sm:p-8">
      <div className="mx-auto flex min-h-[620px] max-w-[760px] flex-col gap-8 rounded-xl bg-background px-5 py-7 ring-1 ring-border/60 sm:min-h-[720px] sm:px-10 sm:py-12">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-16" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-16" />
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="contents">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:hidden">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="rounded-xl border border-border/60 p-3">
                <Skeleton className="h-4 w-11/12" />
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  {Array.from({ length: 4 }, (_, row) => (
                    <div key={row} className="contents">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-3 w-20 justify-self-end" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden flex-col gap-3 sm:flex">
            <div className="grid grid-cols-[minmax(160px,1fr)_56px_80px_96px] gap-4 border-b border-border/50 pb-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8 justify-self-end" />
              <Skeleton className="h-3 w-12 justify-self-end" />
              <Skeleton className="h-3 w-14 justify-self-end" />
            </div>
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="grid grid-cols-[minmax(160px,1fr)_56px_80px_96px] gap-4 py-1"
              >
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4 justify-self-end" />
                <Skeleton className="h-4 w-12 justify-self-end" />
                <Skeleton className="h-4 w-16 justify-self-end" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-col items-end gap-2 border-t border-border/50 pt-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-44" />
        </div>
      </div>
    </div>
  );
}

function PaymentHistorySkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
      <Skeleton className="mb-3 h-4 w-32" />
      <div className="flex flex-col gap-3 sm:hidden">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="rounded-xl border border-border/60 p-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-border/60 pt-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12 justify-self-end" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-20 justify-self-end" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden flex-col gap-2 sm:flex">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="grid grid-cols-5 gap-4 border-t border-border/30 pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20 justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  );
}

export type DocumentsListPaneSkeletonProps = {
  rowCount?: number;
};

export function DocumentsListPaneSkeleton({ rowCount = 6 }: DocumentsListPaneSkeletonProps) {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-border">
          <SkeletonRepeat
            count={rowCount}
            render={(i) => (
              <li key={i} className="flex flex-col gap-1 border-l-2 border-transparent px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Skeleton className="h-4 w-9 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16 shrink-0" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3.5 w-28" />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Skeleton className="size-2 rounded-full" />
                    <Skeleton className="h-3.5 w-12" />
                  </div>
                </div>
              </li>
            )}
          />
        </ul>
      </div>
    </div>
  );
}

export type DocumentsMasterDetailSkeletonProps = {
  rowCount?: number;
};

export function DocumentsMasterDetailSkeleton({ rowCount = 6 }: DocumentsMasterDetailSkeletonProps) {
  return (
    <div className="flex min-h-0 lg:h-full lg:overflow-hidden">
      {/* List pane — visible on mobile index; always visible on lg+ */}
      <aside className="flex w-full shrink-0 border-r border-border lg:w-72 lg:overflow-y-auto">
        <DocumentsListPaneSkeleton rowCount={rowCount} />
      </aside>

      {/* Detail pane — desktop only in loading state */}
      <main className="hidden min-w-0 flex-1 p-4 sm:p-6 lg:block lg:overflow-y-auto">
        <DocumentDetailSkeleton />
      </main>
    </div>
  );
}
