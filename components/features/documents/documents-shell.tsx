"use client";

import { Suspense, type ReactNode } from "react";
import { useSelectedLayoutSegments } from "next/navigation";

import { cn } from "@/lib/utils";
import { isTypeSlug } from "@/lib/documents/document-routes";
import { DocumentsListPaneSkeleton } from "@/components/features/documents/skeletons";
import {
  DocumentsListPanelProvider,
  DocumentsListToggle,
  useDocumentsListPanel,
} from "@/components/features/documents/documents-list-panel";

type DocumentsShellProps = {
  children: ReactNode;
  /** The `@list` parallel route slot — the server-filtered list pane. */
  list: ReactNode;
  /** From the `documents_list_state` cookie, so first paint matches. */
  initialListCollapsed?: boolean;
};

/**
 * Responsive master-detail shell for the documents section.
 */
export function DocumentsShell({ initialListCollapsed = false, ...props }: DocumentsShellProps) {
  return (
    <DocumentsListPanelProvider initialCollapsed={initialListCollapsed}>
      <DocumentsShellFrame {...props} />
    </DocumentsListPanelProvider>
  );
}

function DocumentsShellFrame({ children, list }: Omit<DocumentsShellProps, "initialListCollapsed">) {
  const segments = useSelectedLayoutSegments();
  const panel = useDocumentsListPanel();
  const collapsed = panel?.collapsed ?? false;

  const isFullBleed = segments[0] === "new" || segments[1] === "edit";

  if (isFullBleed) {
    return <div className="min-h-full">{children}</div>;
  }

  const onDetail =
    segments.length > 0 &&
    segments[0] !== "new" &&
    !isTypeSlug(segments[0] as string);

  return (
    <div
      data-page-fullbleed
      className="flex min-h-0 lg:h-[calc(100dvh-var(--topbar-h)-var(--shell-inset))] lg:overflow-hidden"
    >
      <aside
        className={cn(
          "shrink-0 lg:flex lg:border-r lg:border-border lg:overflow-y-auto",
          "lg:transition-[width] lg:duration-200 lg:ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          collapsed ? "lg:w-12 lg:overflow-hidden" : "lg:w-80",
          onDetail ? "hidden" : "flex w-full",
        )}
      >
        {/* Collapsed rail (desktop): just the button to bring the list back. */}
        {collapsed && panel ? (
          <div className="hidden w-full justify-center pt-3 lg:flex">
            <DocumentsListToggle collapsed onToggle={panel.toggle} />
          </div>
        ) : null}
        {/* Kept mounted while collapsed so search and scroll survive. */}
        <div className={cn("flex w-full min-w-0", collapsed && "lg:hidden")}>
          <Suspense fallback={<DocumentsListPaneSkeleton rowCount={6} />}>
            {list}
          </Suspense>
        </div>
      </aside>

      <main
        className={cn(
          "min-w-0 flex-1 p-4 sm:p-6 lg:overflow-y-auto",
          // The document workspace brings its own header, rail and scroll areas.
          "has-[[data-doc-workspace]]:p-0 lg:has-[[data-doc-workspace]]:overflow-hidden",
          onDetail ? "block" : "hidden lg:block",
        )}
      >
        {children}
      </main>
    </div>
  );
}
