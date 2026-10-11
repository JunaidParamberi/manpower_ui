"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DocHeader } from "@/components/features/documents/sheets/doc-header";
import { DocumentSheet } from "@/components/features/documents/sheets/document-sheet";
import { TiptapEditor } from "@/components/features/documents/editor/tiptap-editor";
import { documentTypeLabel } from "@/lib/documents/display";
import { updateDocumentContent } from "@/lib/documents/document-mutations";
import type { ClientRow, DocumentType, ProjectListRow, TiptapDoc } from "@/types";
import type { VariableContext } from "@/lib/documents/variables";
import { DocumentWorkspace, type DocumentWorkspaceProps, type EditorCtx } from "../document-workspace";
import { EditableText } from "../paper/editable-text";
import { RailSection } from "../rail/rail-section";
import { RailText } from "../rail/rail-text";
import { SaveAsTemplateButton } from "@/components/features/documents/save-as-template-button";
import { toSheetBrand, toSheetSender } from "../sheet-mappers";
import { ClientRailField, ProjectRailField } from "../shared-fields";
import { useDocumentProps } from "../use-document-props";

export type RichTextEditorProps = Omit<
  DocumentWorkspaceProps,
  "renderPaper" | "renderRail" | "readinessMessage" | "readinessAction" | "title"
> & {
  type: DocumentType;
  variableContext: VariableContext;
  /** The document's own name; carried on every save so a blank one never resets it. */
  documentTitle: string;
  contentJson: TiptapDoc;
  clientId: string | null;
  projectId: string | null;
  clients: ClientRow[];
  projects: ProjectListRow[];
  /** Today's read-only sheet, rendered on the server. */
  readPaper: ReactNode;
};

/** Free-form documents (notes, statements, letters): a title and rich text on the paper. */
export function RichTextEditor(props: RichTextEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(props.contentJson);
  const latest = useRef(props.contentJson);
  const docProps = useDocumentProps({ documentId: props.documentId, type: props.type, title: props.documentTitle, clientId: props.clientId, projectId: props.projectId });
  const { clientId, projectId } = docProps;

  function saveContent(ctx: EditorCtx, next: TiptapDoc) {
    setContent(next);
    latest.current = next;
    ctx.queue.schedule("content", async () => {
      const r = await updateDocumentContent(props.documentId, latest.current);
      return r.ok ? { ok: true } : { ok: false, error: r.message };
    });
  }

  const renderPaper = (ctx: EditorCtx) => {
    if (ctx.mode === "read") return <div className="w-full max-w-[800px] overflow-x-auto">{props.readPaper}</div>;
    const ro = ctx.readOnly;
    const brand = props.variableContext.brand;
    return (
      <div className="sheet-host--bare w-full max-w-[800px]">
        <DocumentSheet variant="sheet--edit" accentColor={brand?.primary_color ?? null}>
          <DocHeader
            brand={toSheetBrand(brand)}
            sender={toSheetSender(props.variableContext.sender)}
            docType={documentTypeLabel(props.type)}
            docNumber={null}
          />
          <EditableText
            value={docProps.title}
            placeholder="Untitled"
            aria-label="Title"
            readOnly={ro}
            onChange={(v) => docProps.save(ctx.queue, { title: v })}
            className="-m-1 mb-4 p-1 text-[30px] leading-[1.1] font-semibold tracking-[-0.03em]"
          />
          <TiptapEditor
            variant="plain"
            value={content}
            onChange={(n) => {
              if (!ro) saveContent(ctx, n);
            }}
            placeholder="Start writing…"
          />
        </DocumentSheet>
      </div>
    );
  };

  const renderRail = (ctx: EditorCtx) => {
    const inRead = ctx.mode === "read";
    return (
      <>
        <RailSection title="Details">
          <RailText
            id="doc-title"
            label="Name"
            value={docProps.title}
            placeholder="Named for you"
            disabled={inRead}
            onChange={(v) => docProps.save(ctx.queue, { title: v })}
          />
          <ClientRailField
            clients={props.clients}
            clientId={clientId}
            disabled={inRead}
            side={ctx.railSide}
            onPick={(v) => docProps.save(ctx.queue, { client_id: v, project_id: null })}
            onNew={() => router.push("/clients")}
          />
          <ProjectRailField
            projects={props.projects}
            projectId={projectId}
            clientId={clientId}
            disabled={inRead}
            side={ctx.railSide}
            onPick={(v) => docProps.save(ctx.queue, { client_id: clientId, project_id: v })}
          />
        </RailSection>
        {!inRead ? (
          <RailSection title="Template">
            <div className="px-2">
              <SaveAsTemplateButton type={props.type} content={content} defaultName={docProps.title || documentTypeLabel(props.type)} />
            </div>
          </RailSection>
        ) : null}
      </>
    );
  };

  return (
    <DocumentWorkspace
      {...props}
      title={docProps.title || documentTypeLabel(props.type)}
      readinessMessage={null}
      renderPaper={renderPaper}
      renderRail={renderRail}
    />
  );
}
