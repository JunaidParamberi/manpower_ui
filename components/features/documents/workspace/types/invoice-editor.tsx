"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DocHeader } from "@/components/features/documents/sheets/doc-header";
import { DocumentSheet } from "@/components/features/documents/sheets/document-sheet";
import { ImportTimeSheet } from "@/components/features/documents/import-time-sheet";
import { InvoiceRecurringSection } from "@/components/features/documents/invoice-recurring-section";
import { TdsCertificateControl } from "@/components/features/documents/tds-certificate-control";
import { computeDocumentTotals } from "@/lib/documents/compute-document-totals";
import { documentStatusLabel, INVOICE_MANUAL_STATUSES, isManualInvoiceStatus } from "@/lib/documents/display";
import { getDocumentReadiness, readinessMessage } from "@/lib/documents/readiness";
import { TAX_MODE_LABELS, type TaxMode } from "@/lib/documents/tax/compute-tax";
import { updateInvoiceManualStatus } from "@/lib/documents/document-mutations";
import { updateInvoiceMeta } from "@/lib/documents/invoice-mutations";
import { relativeDays } from "@/lib/documents/editor/calendar-grid";
import type { ClientRow, DocumentStatus, LineItemRow, ProjectListRow, RecurringInvoiceRow, ServiceRow } from "@/types";
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
import { RailPicker } from "../rail/rail-picker";
import { RailSection } from "../rail/rail-section";
import { RailText } from "../rail/rail-text";
import { RailSwitch } from "../rail/rail-switch";
import { toSheetBrand, toSheetSender } from "../sheet-mappers";
import { BilledToBlock, ClientRailField, CurrencyRailField, ProjectRailField } from "../shared-fields";
import { useDocumentProps } from "../use-document-props";
import { useLineItems } from "../use-line-items";

export type InvoiceMeta = {
  invoice_number: string | null;
  /** `YYYY-MM-DD` the invoice was created. */
  issued: string;
  due_date: string | null;
  payment_terms: string | null;
  notes_footer: string | null;
  lpo_reference_number: string | null;
  currency: string;
  fx_rate: number | null;
  discount_value: number;
  discount_type: "percent" | "flat";
  tax_mode: TaxMode;
  tax_rate: number;
  tds_enabled: boolean;
  tds_rate: number;
};

export type InvoiceEditorProps = Omit<
  DocumentWorkspaceProps,
  "renderPaper" | "renderRail" | "readinessMessage" | "readinessAction" | "title"
> & {
  variableContext: VariableContext;
  /** The document's own name; carried on every save so a blank one never resets it. */
  documentTitle: string;
  meta: InvoiceMeta;
  lineItems: LineItemRow[];
  clientId: string | null;
  projectId: string | null;
  clients: ClientRow[];
  projects: ProjectListRow[];
  services: ServiceRow[];
  recurringSchedule: RecurringInvoiceRow | null;
  generatedFromScheduleId: string | null;
  hasTdsCertificate: boolean;
  defaultTdsRate: number;
  /** Today's read-only sheet, rendered on the server; identical to the PDF and the portal. */
  readPaper: ReactNode;
  /** Payment history and pay link, shown in the rail. */
  balanceRail?: ReactNode;
};

const PROPS_LOCKED = new Set(["paid", "partially_paid", "written_off", "voided"]);
const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fmtShort = (iso: string) => fmt(iso).replace(/ \d{4}$/, "");
export function InvoiceEditor(props: InvoiceEditorProps) {
  const router = useRouter();
  const [meta, setMeta] = useState(props.meta);
  const { lines, newKey, onChange: onLines, reset: resetLines } = useLineItems(props.documentId, props.lineItems);
  /** Set just before asking the server for the imported lines, so only that refresh replaces what is on screen. */
  const awaitingImport = useRef(false);
  useEffect(() => {
    if (!awaitingImport.current) return;
    awaitingImport.current = false;
    resetLines(props.lineItems);
  }, [props.lineItems, resetLines]);
  const docProps = useDocumentProps({ documentId: props.documentId, type: "invoice", title: props.documentTitle, clientId: props.clientId, projectId: props.projectId });
  const { clientId, projectId } = docProps;
  const discountRef = useRef<HTMLDivElement>(null);
  const taxRef = useRef<HTMLDivElement>(null);
  const dueRef = useRef<HTMLButtonElement>(null);

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
  const tdsAmount = meta.tds_enabled ? +((totals.discountedSubtotal * meta.tds_rate) / 100).toFixed(2) : 0;

  const message = readinessMessage(
    getDocumentReadiness(
      { type: "invoice", client_id: clientId, due_date: meta.due_date },
      lines.map((l) => ({ quantity: l.quantity, unit_price: l.unit_price })),
    ),
    "send",
  );

  // ── writes ────────────────────────────────────────────────────────────────
  function saveMeta(ctx: EditorCtx, next: InvoiceMeta, immediate = false) {
    setMeta(next);
    const { issued, ...payload } = next;
    void issued;
    ctx.queue.schedule(
      "meta",
      async () => {
        const r = await updateInvoiceMeta(props.documentId, payload);
        return r.ok ? { ok: true } : { ok: false, error: r.error ?? "Couldn't save" };
      },
      { immediate },
    );
  }
  function saveProps(ctx: EditorCtx, next: { client_id: string | null; project_id: string | null }) {
    docProps.save(ctx.queue, next);
  }

  // ── paper ─────────────────────────────────────────────────────────────────
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
            docType="Invoice"
            docNumber={meta.invoice_number}
            docNumberSlot={
              <EditableText
                value={meta.invoice_number ?? ""}
                placeholder="Number"
                aria-label="Invoice number"
                readOnly={ro}
                onChange={(v) => saveMeta(ctx, { ...meta, invoice_number: v || null })}
                className="inline-block px-0.5"
              />
            }
          />
          <div className="parties">
            <div>
              <div className="party__label">Billed to</div>
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
              <div className="party__label">Due</div>
              <RailDatePicker
                side="bottom"
                withTerms
                referenceDate={meta.issued}
                today={ctx.today}
                value={meta.due_date}
                onChange={(iso, terms) => saveMeta(ctx, { ...meta, due_date: iso, payment_terms: terms }, true)}
                trigger={
                  <PaperField ref={dueRef} readOnly={ro} warn={!meta.due_date} aria-label="Due date" className="font-medium">
                    {meta.due_date ? fmt(meta.due_date) : "Add due date"}
                  </PaperField>
                }
              />
              {meta.payment_terms ? <div className="mt-0.5 text-[12px] text-[var(--sheet-faint)]">{meta.payment_terms}</div> : null}
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
            trailingMenu={
              props.status === "draft" && props.projects.length > 0 ? (
                <ImportTimeSheet
                  invoiceId={props.documentId}
                  invoiceClientId={clientId}
                  projects={props.projects}
                  currency={meta.currency}
                  // Save what is typed first, then reload: the imported lines come from the server.
                  onImported={() => {
                    void ctx.queue.flush().then(() => {
                      awaitingImport.current = true;
                      router.refresh();
                    });
                  }}
                />
              ) : null
            }
          />
          <PaperTotals
            totals={totals}
            currency={meta.currency}
            readOnly={ro}
            discountLabel={meta.discount_value ? (meta.discount_type === "percent" ? `Discount ${meta.discount_value}%` : "Discount") : null}
            taxLabel={meta.tax_mode !== "none" ? `${TAX_MODE_LABELS[meta.tax_mode]} ${meta.tax_rate}%` : null}
            tds={meta.tds_enabled ? { rate: meta.tds_rate, amount: tdsAmount } : null}
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
              <h4>Notes</h4>
              <EditableText
                multiline
                value={meta.notes_footer ?? ""}
                placeholder="Add a note for your client"
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

  // ── rail ──────────────────────────────────────────────────────────────────
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
          {!inRead && props.status !== "draft" && isManualInvoiceStatus(props.status) ? (
            <RailPicker
              side={ctx.railSide}
              placeholder="Change status"
              value={props.status}
              options={INVOICE_MANUAL_STATUSES.map((s) => ({ value: s, label: documentStatusLabel(s as DocumentStatus) }))}
              onPick={(v) => {
                ctx.queue.schedule(
                  "status",
                  async () => {
                    const r = await updateInvoiceManualStatus(props.documentId, v);
                    if (r.ok) router.refresh();
                    return r.ok ? { ok: true } : { ok: false, error: r.message };
                  },
                  { immediate: true },
                );
              }}
              trigger={<RailField label="Status">{documentStatusLabel(props.status)}</RailField>}
            />
          ) : null}
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
            withTerms
            referenceDate={meta.issued}
            today={ctx.today}
            value={meta.due_date}
            onChange={(iso, terms) => saveMeta(ctx, { ...meta, due_date: iso, payment_terms: terms }, true)}
            trigger={
              <RailField label="Due" warn={!meta.due_date} disabled={contentLocked}>
                {meta.due_date ? (
                  <>
                    <span>{fmtShort(meta.due_date)}</span>
                    <span className="text-[12px] font-normal text-[var(--fg-3)]">{meta.payment_terms ?? relativeDays(meta.due_date, ctx.today)}</span>
                  </>
                ) : (
                  "Add date"
                )}
              </RailField>
            }
          />
        </RailSection>
        <RailSection title="Tax & deductions">
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
          <RailSwitch
            label="TDS deduction"
            checked={meta.tds_enabled}
            disabled={contentLocked}
            onCheckedChange={(on) =>
              saveMeta(ctx, { ...meta, tds_enabled: on, tds_rate: on && !meta.tds_rate ? props.defaultTdsRate : meta.tds_rate }, true)
            }
          />
          {meta.tds_enabled ? (
            <>
              <InlineNumber
                id="tds-rate"
                label="TDS rate"
                value={meta.tds_rate}
                suffix="%"
                bounds={{ min: 0, max: 100, step: 1 }}
                disabled={contentLocked}
                onChange={(n) => saveMeta(ctx, { ...meta, tds_rate: n })}
              />
              <div className="px-2 pb-1.5">
                <TdsCertificateControl documentId={props.documentId} hasCertificate={props.hasTdsCertificate} />
              </div>
            </>
          ) : null}
        </RailSection>
        <RailSection title="Repeat">
          <div className="px-1">
            <InvoiceRecurringSection
              documentId={props.documentId}
              invoiceStatus={props.status}
              hasClient={Boolean(clientId)}
              hasLineItems={lines.length > 0}
              initialSchedule={props.recurringSchedule}
              generatedFromScheduleId={props.generatedFromScheduleId}
              defaultStartDate={meta.due_date ?? undefined}
            />
          </div>
        </RailSection>
        {props.balanceRail}
      </>
    );
  };

  return (
    <DocumentWorkspace
      {...props}
      title={meta.invoice_number ?? "Invoice"}
      readinessMessage={message}
      readinessAction={!meta.due_date ? { label: "Set due date", onClick: () => dueRef.current?.click() } : undefined}
      renderPaper={renderPaper}
      renderRail={renderRail}
    />
  );
}
