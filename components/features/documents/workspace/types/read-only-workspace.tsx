"use client";

import type { ReactNode } from "react";
import { DocumentWorkspace, type DocumentWorkspaceProps } from "../document-workspace";

export type ReadOnlyWorkspaceProps = Omit<
  DocumentWorkspaceProps,
  "mode" | "fresh" | "canEditContent" | "canSwitchToEdit" | "editHref" | "actionsEdit" | "renderPaper" | "renderRail" | "readinessMessage" | "readinessAction"
> & {
  /** The finished document, rendered on the server. */
  readPaper: ReactNode;
  /** Settings shown in the rail, as read-only rows. */
  rail: ReactNode;
};

/** A document that is only ever read, such as a receipt: the same page, with no editing. */
export function ReadOnlyWorkspace({ readPaper, rail, ...props }: ReadOnlyWorkspaceProps) {
  return (
    <DocumentWorkspace
      {...props}
      mode="read"
      fresh={false}
      canEditContent={false}
      canSwitchToEdit={false}
      editHref={props.readHref}
      actionsEdit={null}
      readinessMessage={null}
      renderPaper={() => <div className="w-full max-w-[800px] overflow-x-auto">{readPaper}</div>}
      renderRail={() => rail}
    />
  );
}
