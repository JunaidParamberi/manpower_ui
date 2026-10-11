import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { DocumentsShell } from "@/components/features/documents/documents-shell";
import { DOCUMENTS_LIST_COOKIE, parseListCollapsedCookie } from "@/lib/documents/list-panel-state";

export default async function DocumentsLayout({
  children,
  list,
}: {
  children: ReactNode;
  /**
   * The `@list` parallel route slot. Layouts receive neither searchParams nor
   * the active pathname on the server, but a slot does — so the list pane is
   * fetched there, filtered by type and search in Postgres.
   */
  list: ReactNode;
}) {
  // Read on the server so the list opens collapsed or expanded without a flash.
  const listCollapsed = parseListCollapsedCookie((await cookies()).get(DOCUMENTS_LIST_COOKIE)?.value);
  return (
    <DocumentsShell list={list} initialListCollapsed={listCollapsed}>
      {children}
    </DocumentsShell>
  );
}
