"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DocHeader } from "@/components/features/documents/sheets/doc-header";
import { DocumentSheet } from "@/components/features/documents/sheets/document-sheet";
import { computeDocumentTotals } from "@/lib/documents/compute-document-totals";
import { getDocumentReadiness, readinessMessage } from "@/lib/documents/readiness";
import { TAX_MODE_LABELS, type TaxMode } from "@/lib/documents/tax/compute-tax";
import { updateQuoteMeta } from "@/lib/documents/quote-mutations";
import { relativeDays } from "@/lib/documents/editor/calendar-grid";
import type { ClientRow, LineItemRow, ProjectListRow, ServiceRow } from "@/types";
import type { VariableContext } from "@/lib/documents/variables";
import { DocumentWorkspace, type DocumentWorkspaceProps, type EditorCtx } from "../document-workspace";
import { EditableText } from "../paper/editable-text";
import { LineItemsGrid } from "../paper/line-items-grid";
import { PaperField } from "../paper/paper-field";
import { PaperTotals } from "../paper/paper-totals";
import { InlineNumber } from "../rail/inline-number";
import { PillSwitch } from "../rail/pill-switch";
import { RailDatePicker } from "../rail/rail-date-picker";
import { RailField } from "../rail/rail-field";
import { RailSection } from "../rail/rail-section";
import { RailText } from "../rail/rail-text";
import { toSheetBrand, toSheetSender } from "../sheet-mappers";
import { BilledToBlock, ClientRailField, CurrencyRailField, ProjectRailField } from "../shared-fields";
import { useDocumentProps } from "../use-document-props";
import { useLineItems } from "../use-line-items";

export type QuoteMeta = {
  quote_number: string | null;
  /** `YYYY-MM-DD` the quote was created. */
  issued: string;
  valid_until: string | null;
  notes_footer: string | null;
  currency: string;
  fx_rate: number | null;
  discount_value: number;
  discount_type: "percent" | "flat";
  tax_mode: TaxMode;
  tax_rate: number;
};

export type QuoteEditorProps = Omit<
  DocumentWorkspaceProps,
  "renderPaper" | "renderRail" | "readinessMessage" | "readinessAction" | "title"
> & {
  variableContext: VariableContext;
  /** The document's own name; carried on every save so a blank one never resets it. */
  documentTitle: string;
  meta: QuoteMeta;
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

const PROPS_LOCKED = new Set(["approved", "declined", "voided"]);
const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtShort = (iso: string) => fmt(iso).replace(/ \d{4}$/, "");

export function QuoteEditor(props: QuoteEditorProps) {
  const router = useRouter();
  const [meta, setMeta] = useState(props.meta);
  const { lines, newKey, onChange: onLines } = useLineItems(props.documentId, props.lineItems);
  const docProps = useDocumentProps({ documentId: props.documentId, type: "quote", title: props.documentTitle, clientId: props.clientId, projectId: props.projectId });
  const { clientId, projectId } = docProps;
  const discountRef = useRef<HTMLDivElement>(null);
  const taxRef = useRef<HTMLDivElement>(null);
  const validRef = useRef<HTMLButtonElement>(null);

  const client = props.clients.find((c) => c.id === clientId) ?? null;
  const project = props.projects.find((pr) => pr.id === projectId) ?? null;

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
      { type: "quote", client_id: clientId, valid_until: meta.valid_until },
      lines.map((l) => ({ quantity: l.quantity, unit_price: l.unit_price })),
    ),
    "send",
  );

  function saveMeta(ctx: EditorCtx, next: QuoteMeta, immediate = false) {
    setMeta(next);
    const { issued, ...payload } = next;
    void issued;
    ctx.queue.schedule(
      "meta",
      async () => {
        const r = await updateQuoteMeta(props.documentId, payload);
        return r.ok ? { ok: true } : { ok: false, error: r.error ?? "Couldn't save" };
      },
      { immediate },
    );
  }
  function saveProps(ctx: EditorCtx, next: { client_id: string | null; project_id: string | null }) {
    docProps.save(ctx.queue, next);
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
            docType="Quote"
            docNumber={meta.quote_number}
            docNumberSlot={
              <EditableText
                value={meta.quote_number ?? ""}
                placeholder="Number"
                aria-label="Quote number"
                readOnly={ro}
                onChange={(v) => saveMeta(ctx, { ...meta, quote_number: v || null })}
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
                onPick={(v) => saveProps(ctx, { client_id: v, project_id: project && project.client_id === v ? projectId : null })}
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
                  <PaperField ref={validRef} readOnly={ro} warn={!meta.valid_until} aria-label="Valid until" className="font-medium">
                    {meta.valid_until ? fmt(meta.valid_until) : "Add valid-until date"}
                  </PaperField>
                }
              />
            </div>
          </div>
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
            readOnly={ro}
            discountLabel={meta.discount_value ? (meta.discount_type === "percent" ? `Discount ${meta.discount_value}%` : "Discount") : null}
            taxLabel={meta.tax_mode !== "none" ? `${TAX_MODE_LABELS[meta.tax_mode]} ${meta.tax_rate}%` : null}
            onFocusDiscount={() => {
              ctx.openRail();
              requestAnimationFrame(() => discountRef.current?.querySelector("input")?.focus());
            }}
            onFocusTax={() => {
              ctx.openRail();
              if (meta.tax_mode === "none") saveMeta(ctx, { ...meta, tax_mode: "vat", tax_rate: 5 }, true);
              requestAnimationFrame(() => taxRef.current?.querySelector("input")?.focus());
            }}
          />
          <div className="doc-footer !grid-cols-1">
            <div>
              <h4>Terms and notes</h4>
              <EditableText
                multiline
                value={meta.notes_footer ?? ""}
                placeholder="Add terms or a note for your client"
                aria-label="Terms and notes"
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
    const contentLocked = ctx.readOnly;
    const propsLocked = inRead || PROPS_LOCKED.has(props.status);
    const taxOptions = (Object.entries(TAX_MODE_LABELS) as [TaxMode, string][]).map(([value, label]) => ({
      value,
      label: value === "none" ? "No tax" : label,
    }));
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
          <CurrencyRailField
            value={meta.currency}
            clientCurrency={client?.currency ?? null}
            disabled={contentLocked}
            side={ctx.railSide}
            onPick={(v) => saveMeta(ctx, { ...meta, currency: v, fx_rate: null }, true)}
          />
          <RailDatePicker
            side={ctx.railSide}
            clearable
            today={ctx.today}
            value={meta.valid_until}
            onChange={(iso) => saveMeta(ctx, { ...meta, valid_until: iso }, true)}
            trigger={
              <RailField label="Valid until" warn={!meta.valid_until} disabled={contentLocked}>
                {meta.valid_until ? (
                  <>
                    <span>{fmtShort(meta.valid_until)}</span>
                    <span className="text-[12px] font-normal text-[var(--fg-3)]">{relativeDays(meta.valid_until, ctx.today)}</span>
                  </>
                ) : (
                  "Add date"
                )}
              </RailField>
            }
          />
        </RailSection>
        <RailSection title="Tax & discount">
          <PillSwitch
            label="Tax"
            options={taxOptions}
            value={meta.tax_mode}
            disabled={contentLocked}
            onChange={(m) => saveMeta(ctx, { ...meta, tax_mode: m, tax_rate: m === "none" ? 0 : meta.tax_rate || 5 }, true)}
          />
          {meta.tax_mode !== "none" ? (
            <div ref={taxRef}>
              <InlineNumber
                id="tax-rate"
                label="Rate"
                value={meta.tax_rate}
                suffix="%"
                bounds={{ min: 0, max: 100, step: 0.5 }}
                disabled={contentLocked}
                onChange={(n) => saveMeta(ctx, { ...meta, tax_rate: n })}
              />
            </div>
          ) : null}
          <div ref={discountRef}>
            <InlineNumber
              id="discount"
              label="Discount"
              value={meta.discount_value}
              bounds={{ min: 0, max: meta.discount_type === "percent" ? 100 : 10_000_000, step: 1 }}
              disabled={contentLocked}
              unit={{
                options: [{ value: "percent", label: "%" }, { value: "flat", label: meta.currency }],
                value: meta.discount_type,
                onChange: (v) => saveMeta(ctx, { ...meta, discount_type: v === "flat" ? "flat" : "percent" }, true),
              }}
              onChange={(n) => saveMeta(ctx, { ...meta, discount_value: n })}
            />
          </div>
        </RailSection>
        {props.approvalRail}
      </>
    );
  };

  return (
    <DocumentWorkspace
      {...props}
      title={meta.quote_number ?? "Quote"}
      readinessMessage={message}
      readinessAction={!meta.valid_until ? { label: "Set valid-until date", onClick: () => validRef.current?.click() } : undefined}
      renderPaper={renderPaper}
      renderRail={renderRail}
    />
  );
}
