"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DocHeader } from "@/components/features/documents/sheets/doc-header";
import { DocumentSheet } from "@/components/features/documents/sheets/document-sheet";
import { computeDocumentTotals } from "@/lib/documents/compute-document-totals";
import { getDocumentReadiness, readinessMessage } from "@/lib/documents/readiness";
import { TAX_MODE_LABELS, type TaxMode } from "@/lib/documents/tax/compute-tax";
import { updateLPOMeta, uploadLPOPdf } from "@/lib/documents/lpo-mutations";
import { relativeDays } from "@/lib/documents/editor/calendar-grid";
import type { ClientRow, LineItemRow, ProjectListRow, ServiceRow } from "@/types";
import type { VariableContext } from "@/lib/documents/variables";
import { DocumentWorkspace, type DocumentWorkspaceProps, type EditorCtx } from "../document-workspace";
import { LineItemsGrid } from "../paper/line-items-grid";
import { PaperField } from "../paper/paper-field";
import { PaperTotals } from "../paper/paper-totals";
import { InlineNumber } from "../rail/inline-number";
import { RailDatePicker } from "../rail/rail-date-picker";
import { RailField } from "../rail/rail-field";
import { RailSection } from "../rail/rail-section";
import { RailText } from "../rail/rail-text";
import { toSheetBrand, toSheetSender } from "../sheet-mappers";
import { BilledToBlock, ClientRailField, ProjectRailField } from "../shared-fields";
import { Code } from "../token-parts";
import { useDocumentProps } from "../use-document-props";
import { useLineItems } from "../use-line-items";

export type LpoMeta = {
  lpo_number: string;
  /** `YYYY-MM-DD` the order was raised. */
  issued: string;
  lpo_validity_date: string | null;
  lpo_amount: number | null;
  payment_terms: string | null;
  currency: string;
  discount_value: number;
  discount_type: "percent" | "flat";
  tax_mode: TaxMode;
  tax_rate: number;
};

export type LpoEditorProps = Omit<
  DocumentWorkspaceProps,
  "renderPaper" | "renderRail" | "readinessMessage" | "readinessAction" | "title"
> & {
  variableContext: VariableContext;
  /** The document's own name; carried on every save so a blank one never resets it. */
  documentTitle: string;
  meta: LpoMeta;
  lineItems: LineItemRow[];
  clientId: string | null;
  projectId: string | null;
  clients: ClientRow[];
  projects: ProjectListRow[];
  services: ServiceRow[];
  /** Signed link to the client's uploaded LPO, if any. */
  pdfUrl: string | null;
  /** Today's read-only sheet, rendered on the server; identical to the PDF and the portal. */
  readPaper: ReactNode;
  /** Billing progress and invoices raised, shown in the rail. */
  billingRail?: ReactNode;
};

const META_EDITABLE = new Set(["draft", "sent", "viewed"]);
const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function LpoEditor(props: LpoEditorProps) {
  const router = useRouter();
  const [meta, setMeta] = useState(props.meta);
  const { lines, newKey, onChange: onLines } = useLineItems(props.documentId, props.lineItems);
  const docProps = useDocumentProps({ documentId: props.documentId, type: "local_purchase_order", title: props.documentTitle, clientId: props.clientId, projectId: props.projectId });
  const { clientId, projectId } = docProps;
  const pdfUrl = props.pdfUrl;
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const project = props.projects.find((pr) => pr.id === projectId) ?? null;
  const metaEditable = META_EDITABLE.has(props.status);

  const totals = useMemo(
    () =>
      computeDocumentTotals(
        lines.map((l) => ({ quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate })),
        meta.discount_value,
        meta.discount_type,
        { taxMode: meta.tax_mode, taxRate: meta.tax_rate },
      ),
    [lines, meta.discount_value, meta.discount_type, meta.tax_mode, meta.tax_rate],
  );

  const message = readinessMessage(
    getDocumentReadiness(
      { type: "local_purchase_order", client_id: clientId },
      lines.map((l) => ({ quantity: l.quantity, unit_price: l.unit_price })),
    ),
    "send",
  );

  /** The server needs an LPO number; an empty one stays local until you type one. */
  function saveMeta(ctx: EditorCtx, next: LpoMeta, immediate = false) {
    setMeta(next);
    if (!next.lpo_number.trim()) return;
    ctx.queue.schedule(
      "meta",
      async () => {
        const r = await updateLPOMeta(props.documentId, {
          lpo_number: next.lpo_number.trim(),
          lpo_validity_date: next.lpo_validity_date,
          lpo_amount: next.lpo_amount && next.lpo_amount > 0 ? next.lpo_amount : null,
        });
        return r.ok ? { ok: true } : { ok: false, error: r.error ?? "Couldn't save" };
      },
      { immediate },
    );
  }
  function saveProps(ctx: EditorCtx, next: { client_id: string | null; project_id: string | null }) {
    docProps.save(ctx.queue, next);
  }

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("lpo_pdf", file);
    const r = await uploadLPOPdf(props.documentId, fd);
    setUploading(false);
    if (r.ok) {
      toast.success("LPO document uploaded");
      router.refresh();
    } else {
      toast.error(r.error ?? "Couldn't upload that file. Try a PDF or image under 10 MB.");
    }
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
            docType="Purchase order"
            docNumber={meta.lpo_number || null}
          />
          <div className="parties">
            <div>
              <div className="party__label">Client</div>
              <BilledToBlock
                clients={props.clients}
                clientId={clientId}
                readOnly={ro}
                onPick={(v) => saveProps(ctx, { client_id: v, project_id: project && project.client_id === v ? projectId : null })}
              />
            </div>
            <div>
              <div className="party__label">Project</div>
              <div className="font-medium">{project?.title ?? <span className="text-[var(--sheet-faint)]">None</span>}</div>
            </div>
            <div>
              <div className="party__label">Valid until</div>
              <RailDatePicker
                side="bottom"
                clearable
                today={ctx.today}
                value={meta.lpo_validity_date}
                onChange={(iso) => saveMeta(ctx, { ...meta, lpo_validity_date: iso }, true)}
                trigger={
                  <PaperField readOnly={ro || !metaEditable} aria-label="Valid until" className="font-medium">
                    {meta.lpo_validity_date ? fmt(meta.lpo_validity_date) : "Add validity date"}
                  </PaperField>
                }
              />
            </div>
          </div>
          {meta.lpo_amount ? (
            <div className="mb-8 flex items-center justify-between rounded-xl border border-[var(--sheet-line)] px-6 py-4">
              <div>
                <div className="party__label">Authorised total</div>
                <div className="text-[12.5px] text-[var(--sheet-muted)]">Set in the settings on the right.</div>
              </div>
              <div className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums">
                {meta.currency} {meta.lpo_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>
          ) : null}
          <div className="party__label mb-2.5">Ordered items</div>
          <LineItemsGrid
            lines={lines}
            currency={meta.currency}
            services={props.services}
            readOnly={ro}
            showHsn={lines.some((l) => l.hsn_sac_code)}
            newKey={newKey}
            onChange={(n, c) => onLines(ctx.queue, n, c)}
          />
          <PaperTotals
            totals={totals}
            currency={meta.currency}
            readOnly
            discountLabel={meta.discount_value ? (meta.discount_type === "percent" ? `Discount ${meta.discount_value}%` : "Discount") : null}
            taxLabel={meta.tax_mode !== "none" ? `${TAX_MODE_LABELS[meta.tax_mode]} ${meta.tax_rate}%` : null}
            onFocusDiscount={() => {}}
            onFocusTax={() => {}}
          />
        </DocumentSheet>
      </div>
    );
  };

  const renderRail = (ctx: EditorCtx) => {
    const inRead = ctx.mode === "read";
    const propsLocked = inRead || ["voided", "paid", "cancelled"].includes(props.status);
    const metaLocked = inRead || !metaEditable;
    return (
      <>
        <RailSection title="Details">
          <RailText
            id="doc-title"
            label="Name"
            value={docProps.title}
            placeholder="Named for you"
            disabled={ctx.mode === "read"}
            onChange={(v) => docProps.save(ctx.queue, { title: v })}
          />
          <ClientRailField
            clients={props.clients}
            clientId={clientId}
            disabled={propsLocked}
            side={ctx.railSide}
            onPick={(v) => saveProps(ctx, { client_id: v, project_id: null })}
            onNew={() => router.push("/clients")}
          />
          <ProjectRailField
            projects={props.projects}
            projectId={projectId}
            clientId={clientId}
            disabled={propsLocked}
            side={ctx.railSide}
            onPick={(v) => saveProps(ctx, { client_id: clientId, project_id: v })}
          />
          <RailText
            id="lpo-number"
            label="LPO number"
            value={meta.lpo_number}
            placeholder="Add number"
            warn={!meta.lpo_number.trim()}
            disabled={metaLocked}
            onChange={(v) => saveMeta(ctx, { ...meta, lpo_number: v })}
          />
          <RailDatePicker
            side={ctx.railSide}
            clearable
            today={ctx.today}
            value={meta.lpo_validity_date}
            onChange={(iso) => saveMeta(ctx, { ...meta, lpo_validity_date: iso }, true)}
            trigger={
              <RailField label="Valid until" disabled={metaLocked}>
                {meta.lpo_validity_date ? (
                  <>
                    <span>{fmt(meta.lpo_validity_date).replace(/ \d{4}$/, "")}</span>
                    <span className="text-[12px] font-normal text-[var(--fg-3)]">{relativeDays(meta.lpo_validity_date, ctx.today)}</span>
                  </>
                ) : (
                  "Add date"
                )}
              </RailField>
            }
          />
          <InlineNumber
            id="lpo-amount"
            label="Amount ceiling"
            value={meta.lpo_amount ?? 0}
            suffix={meta.currency}
            bounds={{ min: 0, max: 1_000_000_000, step: 100 }}
            disabled={metaLocked}
            onChange={(n) => saveMeta(ctx, { ...meta, lpo_amount: n > 0 ? n : null })}
          />
          <RailField label="Currency" disabled>
            <Code>{meta.currency}</Code>
          </RailField>
        </RailSection>
        <RailSection title="Client's LPO">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="sr-only"
            tabIndex={-1}
            aria-label="Upload the client's LPO"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
          <RailField label="Document" disabled={metaLocked || uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Uploading…" : pdfUrl ? "Replace" : "Upload"}
          </RailField>
          {pdfUrl ? (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-[12px] text-[var(--accent)] hover:underline">
              Open the uploaded LPO
            </a>
          ) : null}
        </RailSection>
        {props.billingRail}
      </>
    );
  };

  return (
    <DocumentWorkspace
      {...props}
      title={meta.lpo_number || "Purchase order"}
      readinessMessage={message}
      renderPaper={renderPaper}
      renderRail={renderRail}
    />
  );
}
