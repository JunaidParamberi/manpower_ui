"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DocHeader } from "@/components/features/documents/sheets/doc-header";
import { DocumentSheet } from "@/components/features/documents/sheets/document-sheet";
import { TiptapEditor } from "@/components/features/documents/editor/tiptap-editor";
import { computeDocumentTotals } from "@/lib/documents/compute-document-totals";
import { getDocumentReadiness, readinessMessage } from "@/lib/documents/readiness";
import { updateDocumentContent } from "@/lib/documents/document-mutations";
import { updateProposalMeta } from "@/lib/documents/proposal-mutations";
import { relativeDays } from "@/lib/documents/editor/calendar-grid";
import type { ClientRow, LineItemRow, ProjectListRow, ProposalContent, ServiceRow, TiptapDoc } from "@/types";
import type { VariableContext } from "@/lib/documents/variables";
import { DocumentWorkspace, type DocumentWorkspaceProps, type EditorCtx } from "../document-workspace";
import { EditableText } from "../paper/editable-text";
import { LineItemsGrid } from "../paper/line-items-grid";
import { PaperField } from "../paper/paper-field";
import { PaperTotals } from "../paper/paper-totals";
import { RailDatePicker } from "../rail/rail-date-picker";
import { RailField } from "../rail/rail-field";
import { RailSection } from "../rail/rail-section";
import { RailText } from "../rail/rail-text";
import { SaveAsTemplateButton } from "@/components/features/documents/save-as-template-button";
import { toSheetBrand, toSheetSender } from "../sheet-mappers";
import { BilledToBlock, ClientRailField, ProjectRailField } from "../shared-fields";
import { Code } from "../token-parts";
import { useDocumentProps } from "../use-document-props";
import { useLineItems } from "../use-line-items";

export type ProposalMeta = {
  proposal_number: string | null;
  /** `YYYY-MM-DD` the proposal was created. */
  issued: string;
  valid_until: string | null;
  notes_footer: string | null;
  currency: string;
  discount_value: number;
  discount_type: "percent" | "flat";
  proposal_content: ProposalContent;
};

export type ProposalEditorProps = Omit<
  DocumentWorkspaceProps,
  "renderPaper" | "renderRail" | "readinessMessage" | "readinessAction" | "title"
> & {
  variableContext: VariableContext;
  /** The document's own name; carried on every save so a blank one never resets it. */
  documentTitle: string;
  meta: ProposalMeta;
  contentJson: TiptapDoc;
  lineItems: LineItemRow[];
  clientId: string | null;
  projectId: string | null;
  clients: ClientRow[];
  projects: ProjectListRow[];
  services: ServiceRow[];
  /** Today's read-only sheet, rendered on the server; identical to the PDF and the portal. */
  readPaper: ReactNode;
  /** Approval status and next steps, shown in the rail once sent. */
  approvalRail?: ReactNode;
};

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function ProposalEditor(props: ProposalEditorProps) {
  const router = useRouter();
  const [meta, setMeta] = useState(props.meta);
  const [content, setContent] = useState(props.contentJson);
  const latestContent = useRef(props.contentJson);
  const { lines, newKey, onChange: onLines } = useLineItems(props.documentId, props.lineItems);
  const docProps = useDocumentProps({ documentId: props.documentId, type: "proposal", title: props.documentTitle, clientId: props.clientId, projectId: props.projectId });
  const { clientId, projectId } = docProps;
  const validRef = useRef<HTMLButtonElement>(null);

  const project = props.projects.find((pr) => pr.id === projectId) ?? null;
  const pc = meta.proposal_content;
  const lineItemsLocked = props.status !== "draft";

  const totals = useMemo(
    () =>
      computeDocumentTotals(
        lines.map((l) => ({ quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate })),
        meta.discount_value,
        meta.discount_type,
        null,
      ),
    [lines, meta.discount_value, meta.discount_type],
  );

  const message = readinessMessage(getDocumentReadiness({ type: "proposal", client_id: clientId }, []), "send");

  function saveMeta(ctx: EditorCtx, next: ProposalMeta, immediate = false) {
    setMeta(next);
    const { issued, currency, ...payload } = next;
    void issued;
    void currency;
    ctx.queue.schedule(
      "meta",
      async () => {
        const r = await updateProposalMeta(props.documentId, payload);
        return r.ok ? { ok: true } : { ok: false, error: r.error ?? "Couldn't save" };
      },
      { immediate },
    );
  }
  function saveContent(ctx: EditorCtx, next: TiptapDoc) {
    setContent(next);
    latestContent.current = next;
    ctx.queue.schedule("content", async () => {
      const r = await updateDocumentContent(props.documentId, latestContent.current);
      return r.ok ? { ok: true } : { ok: false, error: r.message };
    });
  }
  const setCover = (ctx: EditorCtx, patch: Partial<ProposalContent>) =>
    saveMeta(ctx, { ...meta, proposal_content: { ...pc, ...patch } });

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
            docType="Proposal"
            docNumber={meta.proposal_number}
            docNumberSlot={
              <EditableText
                value={meta.proposal_number ?? ""}
                placeholder="Number"
                aria-label="Proposal number"
                readOnly={ro}
                onChange={(v) => saveMeta(ctx, { ...meta, proposal_number: v || null })}
                className="inline-block px-0.5"
              />
            }
          />
          <div className="parties">
            <div>
              <div className="party__label">Prepared for</div>
              <BilledToBlock
                clients={props.clients}
                clientId={clientId}
                readOnly={ro}
                onPick={(v) => docProps.save(ctx.queue, { client_id: v, project_id: project && project.client_id === v ? projectId : null })}
              />
            </div>
            <div>
              <div className="party__label">Issued</div>
              <div className="font-medium">{fmt(meta.issued)}</div>
            </div>
            <div>
              <div className="party__label">Valid until</div>
              <RailDatePicker
                side="bottom"
                clearable
                today={ctx.today}
                value={meta.valid_until}
                onChange={(iso) => saveMeta(ctx, { ...meta, valid_until: iso }, true)}
                trigger={
                  <PaperField ref={validRef} readOnly={ro} aria-label="Valid until" className="font-medium">
                    {meta.valid_until ? fmt(meta.valid_until) : "Add validity date"}
                  </PaperField>
                }
              />
            </div>
          </div>
          <div className="mb-8 rounded-xl border border-[var(--sheet-line)] bg-[color-mix(in_srgb,var(--sheet-accent-soft)_55%,white)] px-8 py-8">
            <EditableText
              value={pc.headline ?? ""}
              placeholder="Cover headline"
              aria-label="Cover headline"
              readOnly={ro}
              onChange={(v) => setCover(ctx, { headline: v || null })}
              className="-m-1 p-1 text-[34px] leading-[1.1] font-semibold tracking-[-0.03em]"
            />
            <EditableText
              multiline
              value={pc.subhead ?? ""}
              placeholder="A short line that frames the proposal"
              aria-label="Subheadline"
              readOnly={ro}
              onChange={(v) => setCover(ctx, { subhead: v || null })}
              className="-m-1 mt-2 p-1 text-[15px] text-[var(--sheet-muted)]"
            />
            {pc.investment_range ? (
              <p className="mt-3 text-[12px]">
                <span className="mr-1.5 text-[10px] tracking-[0.1em] text-[var(--sheet-faint)] uppercase">Investment</span>
                <span className="font-medium">{pc.investment_range}</span>
              </p>
            ) : null}
          </div>
          <TiptapEditor
            variant="plain"
            value={content}
            onChange={(n) => {
              if (!ro) saveContent(ctx, n);
            }}
            placeholder="Start writing your proposal…"
          />
          <div className="party__label mt-8 mb-2.5">Pricing</div>
          <LineItemsGrid
            lines={lines}
            currency={meta.currency}
            services={props.services}
            readOnly={ro || lineItemsLocked}
            showHsn={false}
            newKey={newKey}
            onChange={(n, c) => onLines(ctx.queue, n, c)}
          />
          <PaperTotals
            totals={totals}
            currency={meta.currency}
            readOnly
            discountLabel={meta.discount_value ? (meta.discount_type === "percent" ? `Discount ${meta.discount_value}%` : "Discount") : null}
            taxLabel={null}
            onFocusDiscount={() => {}}
            onFocusTax={() => {}}
          />
          <div className="doc-footer !grid-cols-1">
            <div>
              <h4>Notes</h4>
              <EditableText
                multiline
                value={meta.notes_footer ?? ""}
                placeholder="Add terms or a note for your client"
                aria-label="Notes"
                readOnly={ro}
                onChange={(v) => saveMeta(ctx, { ...meta, notes_footer: v || null })}
                className="-m-1 min-h-10 p-1"
              />
            </div>
          </div>
        </DocumentSheet>
      </div>
    );
  };

  const renderRail = (ctx: EditorCtx) => {
    const inRead = ctx.mode === "read";
    const locked = ctx.readOnly;
    const propsLocked = inRead || ["approved", "declined", "voided"].includes(props.status);
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
            disabled={propsLocked}
            side={ctx.railSide}
            onPick={(v) => docProps.save(ctx.queue, { client_id: v, project_id: null })}
            onNew={() => router.push("/clients")}
          />
          <ProjectRailField
            projects={props.projects}
            projectId={projectId}
            clientId={clientId}
            disabled={propsLocked}
            side={ctx.railSide}
            onPick={(v) => docProps.save(ctx.queue, { client_id: clientId, project_id: v })}
          />
          <RailField label="Currency" disabled>
            <Code>{meta.currency}</Code>
          </RailField>
          <RailDatePicker
            side={ctx.railSide}
            clearable
            today={ctx.today}
            value={meta.valid_until}
            onChange={(iso) => saveMeta(ctx, { ...meta, valid_until: iso }, true)}
            trigger={
              <RailField label="Valid until" disabled={locked}>
                {meta.valid_until ? (
                  <>
                    <span>{fmt(meta.valid_until).replace(/ \d{4}$/, "")}</span>
                    <span className="text-[12px] font-normal text-[var(--fg-3)]">{relativeDays(meta.valid_until, ctx.today)}</span>
                  </>
                ) : (
                  "Add date"
                )}
              </RailField>
            }
          />
        </RailSection>
        <RailSection title="Cover">
          <RailText
            id="cover-accent"
            label="Accent word"
            value={pc.headline_accent ?? ""}
            placeholder="A word to highlight"
            disabled={locked}
            onChange={(v) => setCover(ctx, { headline_accent: v || null })}
          />
          <RailText
            id="cover-investment"
            label="Investment"
            value={pc.investment_range ?? ""}
            placeholder="e.g. AED 20–25k"
            disabled={locked}
            onChange={(v) => setCover(ctx, { investment_range: v || null })}
          />
        </RailSection>
        {!inRead ? (
          <RailSection title="Template">
            <div className="px-2">
              <SaveAsTemplateButton type="proposal" content={content} defaultName={docProps.title || meta.proposal_number || "Proposal template"} />
            </div>
          </RailSection>
        ) : null}
        {props.approvalRail}
      </>
    );
  };

  return (
    <DocumentWorkspace
      {...props}
      title={meta.proposal_number ?? "Proposal"}
      readinessMessage={message}
      renderPaper={renderPaper}
      renderRail={renderRail}
    />
  );
}
