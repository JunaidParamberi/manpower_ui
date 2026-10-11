import Link from "next/link";
import { notFound } from "next/navigation";

import { getClientById, listClients } from "@/lib/clients/client-queries";
import { getDocumentById } from "@/lib/documents/document-queries";
import {
  getInvoiceAdjustmentsForDocument,
  getInvoiceWithLineItems,
  getPaymentsForDocument,
} from "@/lib/documents/invoice-queries";
import {
  getLinkedInvoicesForLPO,
  getLpoBillingProgress,
  getLpoWithLineItems,
} from "@/lib/documents/lpo-queries";
import { calculateInvoiceBalance, calculateInvoiceTotal } from "@/lib/documents/payment-balance";
import { isSettledStatus } from "@/lib/documents/status-transitions";
import {
  getReceiptData,
  getReceiptsForInvoice,
} from "@/lib/documents/receipt-queries";
import { getProposalWithLineItems } from "@/lib/documents/proposal-queries";
import { getQuoteWithLineItems } from "@/lib/documents/quote-queries";
import { getProfile } from "@/lib/profile/actions";
import { listProjects } from "@/lib/projects/actions";
import { listServices } from "@/lib/services/service-queries";
import { getRecurringBySourceDocument } from "@/lib/recurring/queries";
import { pickMode } from "@/lib/documents/editor/view-mode";
import { tokenColor } from "@/lib/documents/editor/token-color";
import type { TaxMode } from "@/lib/documents/tax/compute-tax";
import { documentListStatusLabel, isDocumentOverdue } from "@/lib/documents/display";
import { buildVariableContext } from "@/lib/documents/variables-server";
import { getServerContext } from "@/lib/supabase/get-server-context";

import { DocumentDetailHeaderActions } from "@/components/features/documents/document-detail-header-actions";
import { DownloadPdfButton } from "@/components/features/documents/download-pdf-button";
import { DocumentSheetRouter } from "@/components/features/documents/sheets/document-sheet-router";
import { MarkPaidButton } from "@/components/features/documents/mark-paid-button";
import { SendInvoiceButton } from "@/components/features/documents/send-invoice-button";
import { SendLpoButton } from "@/components/features/documents/send-lpo-button";
import { SendProposalButton } from "@/components/features/documents/send-proposal-button";
import { SendQuoteButton } from "@/components/features/documents/send-quote-button";
import type { DocumentStatus } from "@/types";
import { InvoiceEditor } from "@/components/features/documents/workspace/types/invoice-editor";
import { QuoteEditor } from "@/components/features/documents/workspace/types/quote-editor";
import { LpoEditor } from "@/components/features/documents/workspace/types/lpo-editor";
import { ProposalEditor } from "@/components/features/documents/workspace/types/proposal-editor";
import { RichTextEditor } from "@/components/features/documents/workspace/types/rich-text-editor";
import { ReadOnlyWorkspace } from "@/components/features/documents/workspace/types/read-only-workspace";
import { RailSection } from "@/components/features/documents/workspace/rail/rail-section";
import { RailField } from "@/components/features/documents/workspace/rail/rail-field";
import { ApprovalRail } from "@/components/features/documents/workspace/approval-rail";
import { LpoBillingRail } from "@/components/features/documents/workspace/lpo-billing-rail";
import { approvalLink } from "@/lib/documents/approval-link";
import { InvoiceBalanceRail } from "@/components/features/documents/workspace/invoice-balance-rail";
import { getDocumentReadiness, readinessMessage } from "@/lib/documents/readiness";
import { KraftRecordHelp } from "@/components/features/ai-panel/kraft-record-help";
import { documentHelp } from "@/lib/kraft/record-help";

/** Clients, projects and services the editors pick from. */
async function loadEditorLists() {
  const [clientsResult, projectsResult, services] = await Promise.all([listClients(), listProjects(), listServices()]);
  return {
    clients: clientsResult.ok ? clientsResult.clients : [],
    projects: projectsResult.ok ? projectsResult.projects : [],
    services,
  };
}

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

function statusTone(status: string, flags: { overdue: boolean; settledGood: boolean }): Tone {
  if (status === "voided" || status === "declined" || status === "cancelled") return "danger";
  if (flags.settledGood || status === "approved") return "success";
  if (flags.overdue || status === "partially_paid") return "warning";
  if (status === "draft") return "neutral";
  return "accent";
}

export async function DocumentDetail({
  id,
  wantEdit = false,
  wantRead = false,
  fresh = false,
}: {
  id: string;
  /** `?edit=1`: open a non-draft document in the edit view. */
  wantEdit?: boolean;
  /** `?view=1`: show a draft as the finished document (what Done does). */
  wantRead?: boolean;
  /** `?fresh=1`: opened straight after New; an untouched draft is deleted on leave. */
  fresh?: boolean;
}) {
  const document = await getDocumentById(id);
  if (!document) {
    notFound();
  }

  const [
    client,
    variableContext,
    invoiceData,
    quoteData,
    proposalData,
    payments,
    adjustments,
    voucherDocs,
    voucherData,
    linkedLPOInvoices,
    lpoBillingProgress,
    lpoData,
    profileResult,
  ] = await Promise.all([
    document.client_id ? getClientById(document.client_id) : Promise.resolve(null),
    buildVariableContext({
      clientId: document.client_id,
      projectId: document.project_id,
    }),
    document.type === "invoice" ? getInvoiceWithLineItems(id) : Promise.resolve(null),
    document.type === "quote" ? getQuoteWithLineItems(id) : Promise.resolve(null),
    document.type === "proposal" ? getProposalWithLineItems(id) : Promise.resolve(null),
    document.type === "invoice" ? getPaymentsForDocument(id) : Promise.resolve([]),
    document.type === "invoice"
      ? getInvoiceAdjustmentsForDocument(id)
      : Promise.resolve([]),
    document.type === "invoice" ? getReceiptsForInvoice(id) : Promise.resolve([]),
    document.type === "receipt"
      ? getReceiptData(id)
      : Promise.resolve(null),
    document.type === "local_purchase_order"
      ? getLinkedInvoicesForLPO(id)
      : Promise.resolve([]),
    document.type === "local_purchase_order"
      ? getLpoBillingProgress(id)
      : Promise.resolve(null),
    document.type === "local_purchase_order"
      ? getLpoWithLineItems(id)
      : Promise.resolve(null),
    getProfile(),
  ]);

  // What the draft still needs before it can be sent (null when complete or
  // no longer sendable). The server enforces the same rule in assertSendable.
  const sendBlockedReason = ["draft", "sent", "viewed"].includes(document.status)
    ? readinessMessage(
        getDocumentReadiness(
          {
            type: document.type,
            client_id: document.client_id,
            valid_until: quoteData?.valid_until ?? document.valid_until,
            due_date: invoiceData?.due_date ?? document.due_date,
          },
          invoiceData?.line_items ??
            quoteData?.line_items ??
            lpoData?.line_items ??
            proposalData?.line_items ??
            [],
        ),
        "send",
      )
    : null;

  const homeCurrency =
    profileResult.ok && profileResult.profile
      ? (profileResult.profile.default_currency ?? "USD")
      : "USD";

  const invoiceTotal = invoiceData
    ? calculateInvoiceTotal(
        invoiceData.line_items,
        Number(invoiceData.discount_value ?? 0),
        (invoiceData.discount_type ?? "percent") as "percent" | "flat",
        { taxMode: invoiceData.tax_mode, taxRate: invoiceData.tax_rate },
      )
    : 0;
  const invoiceBalance = invoiceData
    ? calculateInvoiceBalance({
        invoiceTotal,
        payments: payments.map((payment) => Number(payment.amount)),
        writeOffs: adjustments.map((adjustment) => Number(adjustment.amount)),
      })
    : null;

  const voucherByPaymentId = Object.fromEntries(
    voucherDocs
      .filter((voucher) => voucher.payment_id)
      .map((voucher) => [
        voucher.payment_id as string,
        { id: voucher.id, receipt_number: voucher.receipt_number },
      ]),
  );
  const linkedVoucherIds = new Set(
    Object.values(voucherByPaymentId).map((voucher) => voucher.id),
  );
  const unlinkedVoucher =
    voucherDocs.find(
      (voucher) => !voucher.payment_id && !linkedVoucherIds.has(voucher.id),
    ) ??
    (payments.length === 0
      ? (voucherDocs.find((voucher) => !linkedVoucherIds.has(voucher.id)) ?? null)
      : null);

  const docNumber = document.invoice_number ?? document.quote_number ?? document.proposal_number ?? document.receipt_number ?? document.lpo_number ?? null;
  const pdfFilename = `${(docNumber ?? document.title).replace(/[^a-zA-Z0-9_\-. ]/g, "").trim() || "document"}.pdf`;

  // Kraft's button: problems it can see on this document and what it can do next.
  const helpLineItems =
    invoiceData?.line_items ?? quoteData?.line_items ?? proposalData?.line_items ?? lpoData?.line_items ?? [];
  const kraftHelp = (
    <KraftRecordHelp
      help={documentHelp({
        type: document.type,
        status: document.status,
        label: docNumber ?? document.title,
        hasClient: Boolean(document.client_id),
        lineItemCount: helpLineItems.length,
        allZeroPriced: helpLineItems.length > 0 && helpLineItems.every((item) => Number(item.unit_price ?? 0) === 0),
        dueDate: invoiceData?.due_date ?? document.due_date ?? null,
        validUntil: quoteData?.valid_until ?? document.valid_until ?? null,
        balance: invoiceBalance ? invoiceBalance.balanceDue : null,
        today: new Date().toISOString().slice(0, 10),
      })}
    />
  );

  // ── Invoice ──────────────────────────────────────────────────────────────
  if (document.type === "invoice") {
    const invoiceCurrency = document.currency;
    const invoiceNumber = invoiceData?.invoice_number ?? document.invoice_number;
    const isPaid =
      document.status === "paid" ||
      document.status === "written_off" ||
      (invoiceBalance ? invoiceBalance.balanceDue <= 0 : false);
    const isVoided = document.status === "voided";
    const isSettled = isSettledStatus(document.status);
    const isDraft = document.status === "draft";
    const mode = pickMode({ isDraft, wantEdit, wantRead, canEditWhenSent: !isVoided && !isSettled });

    const [{ clients, projects, services }, recurringSchedule] = await Promise.all([
      loadEditorLists(),
      getRecurringBySourceDocument(document.id),
    ]);
    const dueIso = invoiceData?.due_date ?? document.due_date ?? null;
    const overdue = isDocumentOverdue({ status: document.status, dueDate: dueIso });
    const tone = statusTone(document.status, { overdue, settledGood: isPaid });
    const dateLabel = (iso: string) =>
      new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const sentParts = [
      document.sent_at
        ? `Sent${client?.email ? ` to ${client.email}` : ""} on ${dateLabel(document.sent_at)}`
        : null,
      document.viewed_at ? `viewed ${dateLabel(document.viewed_at)}` : null,
      invoiceBalance && invoiceBalance.totalPaid > 0
        ? `${invoiceCurrency} ${invoiceBalance.totalPaid.toLocaleString("en-US", { maximumFractionDigits: 2 })} paid`
        : null,
    ].filter((x): x is string => Boolean(x));
    const project = projects.find((pr) => pr.id === document.project_id);
    const bannerFilled = [
      "client",
      project ? "project" : null,
      invoiceCurrency,
      invoiceData?.payment_terms ? `${invoiceData.payment_terms} due date` : null,
    ].filter((x): x is string => Boolean(x));
    const payUrl = invoiceData?.pay_token
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/pay/${invoiceData.pay_token}`
      : null;

    return (
      <InvoiceEditor
        mode={mode}
        documentTitle={document.title}
        fresh={fresh && isDraft}
        documentId={document.id}
        backHref="/documents/invoices"
        backLabel="Invoices"
        status={document.status as DocumentStatus}
        statusLabel={documentListStatusLabel(document.status as DocumentStatus, overdue && document.status !== "partially_paid")}
        statusTone={tone}
        canEditContent={isDraft}
        canSwitchToEdit={isDraft || (!isVoided && !isSettled)}
        editHref={`/documents/${document.id}?edit=1`}
        readHref={`/documents/${document.id}?view=1`}
        kraft={kraftHelp}
        today={new Date().toISOString().slice(0, 10)}
        banner={fresh && isDraft && client ? { clientName: client.company ?? client.name, clientColor: tokenColor(client.id), filled: bannerFilled } : null}
        sentParts={sentParts}
        editingSentNote={!isDraft ? "Editing a sent invoice. Your client sees changes when you resend." : null}
        newType="invoice"
        actionsEdit={
          <SendInvoiceButton documentId={document.id} disabled={Boolean(sendBlockedReason)} defaultEmail={client?.email ?? undefined} />
        }
        actionsRead={
          <DocumentDetailHeaderActions
            showEdit={false}
            documentId={document.id}
            pdfFilename={pdfFilename}
            documentStatus={document.status}
            isVoided={isVoided}
            isSettled={isSettled}
            sendButton={
              isDraft ? (
                <SendInvoiceButton documentId={document.id} disabled={Boolean(sendBlockedReason)} defaultEmail={client?.email ?? undefined} />
              ) : undefined
            }
            extraActions={
              !isVoided ? (
                <MarkPaidButton
                  documentId={document.id}
                  invoiceTotal={invoiceBalance?.invoiceTotal ?? 0}
                  totalPaid={invoiceBalance?.totalPaid ?? 0}
                  totalWrittenOff={invoiceBalance?.totalWrittenOff ?? 0}
                  remainingBalance={invoiceBalance?.balanceDue ?? 0}
                  currency={invoiceCurrency}
                  homeCurrency={homeCurrency}
                  isPaid={isPaid}
                />
              ) : null
            }
          />
        }
        variableContext={variableContext}
        meta={{
          invoice_number: invoiceNumber ?? null,
          issued: (document.created_at ?? new Date().toISOString()).slice(0, 10),
          due_date: dueIso,
          payment_terms: invoiceData?.payment_terms ?? null,
          notes_footer: invoiceData?.notes_footer ?? null,
          lpo_reference_number: invoiceData?.lpo_reference_number ?? null,
          currency: invoiceData?.currency ?? invoiceCurrency ?? homeCurrency,
          fx_rate: invoiceData?.fx_rate ?? null,
          discount_value: Number(invoiceData?.discount_value ?? 0),
          discount_type: (invoiceData?.discount_type ?? "percent") as "percent" | "flat",
          tax_mode: (invoiceData?.tax_mode ?? "none") as TaxMode,
          tax_rate: Number(invoiceData?.tax_rate ?? 0),
          tds_enabled: document.tds_enabled ?? false,
          tds_rate: Number(document.tds_rate ?? 0),
        }}
        lineItems={invoiceData?.line_items ?? []}
        clientId={document.client_id}
        projectId={document.project_id}
        clients={clients}
        projects={projects}
        services={services}
        recurringSchedule={recurringSchedule}
        generatedFromScheduleId={invoiceData?.recurring_invoice_id ?? null}
        hasTdsCertificate={Boolean(document.tds_certificate_url)}
        defaultTdsRate={profileResult.ok && profileResult.profile ? (profileResult.profile.default_tds_rate ?? 0) : 0}
        readPaper={
          <DocumentSheetRouter
            document={document}
            variableContext={variableContext}
            lineItems={invoiceData?.line_items ?? []}
            invoiceMeta={{
              dueDate: dueIso,
              paymentTerms: invoiceData?.payment_terms ?? null,
              currency: invoiceCurrency,
              discountValue: Number(invoiceData?.discount_value ?? 0),
              discountType: (invoiceData?.discount_type ?? "percent") as "percent" | "flat",
              notesFooter: invoiceData?.notes_footer ?? null,
            }}
          />
        }
        balanceRail={
          <InvoiceBalanceRail
            balance={invoiceBalance}
            payments={payments}
            currency={invoiceCurrency}
            homeCurrency={homeCurrency}
            voucherByPaymentId={voucherByPaymentId}
            payUrl={payUrl}
            latestReceipt={unlinkedVoucher}
          />
        }
      />
    );
  }

  // ── Quote ─────────────────────────────────────────────────────────────────
  if (document.type === "quote") {
    if (!quoteData) notFound();
    const isDraft = document.status === "draft";
    const canSwitchToEdit = ["sent", "viewed"].includes(document.status);
    const mode = pickMode({ isDraft, wantEdit, wantRead, canEditWhenSent: canSwitchToEdit });
    const { clients, projects, services } = await loadEditorLists();
    const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const project = projects.find((pr) => pr.id === document.project_id);
    const approvalUrl = quoteData.approval_token
      ? approvalLink(quoteData.approval_token, process.env.NEXT_PUBLIC_APP_URL ?? "")
      : null;
    return (
      <QuoteEditor
        mode={mode}
        documentTitle={document.title}
        fresh={fresh && isDraft}
        documentId={document.id}
        backHref="/documents/quotes"
        backLabel="Quotes"
        status={document.status as DocumentStatus}
        statusLabel={documentListStatusLabel(document.status as DocumentStatus)}
        statusTone={statusTone(document.status, { overdue: false, settledGood: false })}
        canEditContent={isDraft}
        canSwitchToEdit={isDraft || canSwitchToEdit}
        editHref={`/documents/${document.id}?edit=1`}
        readHref={`/documents/${document.id}?view=1`}
        kraft={kraftHelp}
        today={new Date().toISOString().slice(0, 10)}
        banner={fresh && isDraft && client ? { clientName: client.company ?? client.name, clientColor: tokenColor(client.id), filled: ["client", project ? "project" : null, document.currency, "validity date"].filter((x): x is string => Boolean(x)) } : null}
        sentParts={[
          document.sent_at ? `Sent${client?.email ? ` to ${client.email}` : ""} on ${dateLabel(document.sent_at)}` : null,
          document.viewed_at ? `viewed ${dateLabel(document.viewed_at)}` : null,
        ].filter((x): x is string => Boolean(x))}
        editingSentNote={!isDraft ? "This quote has been sent. Only the client and project can change now." : null}
        newType="quote"
        actionsEdit={
          <SendQuoteButton documentId={document.id} disabled={Boolean(sendBlockedReason)} defaultEmail={client?.email ?? undefined} />
        }
        actionsRead={
          <DocumentDetailHeaderActions
            showEdit={false}
            documentId={document.id}
            pdfFilename={pdfFilename}
            documentStatus={document.status}
            isVoided={document.status === "voided"}
            sendButton={<SendQuoteButton documentId={document.id} disabled={Boolean(sendBlockedReason)} defaultEmail={client?.email ?? undefined} />}
          />
        }
        variableContext={variableContext}
        meta={{
          quote_number: quoteData.quote_number ?? null,
          issued: (document.created_at ?? new Date().toISOString()).slice(0, 10),
          valid_until: quoteData.valid_until ?? null,
          notes_footer: quoteData.notes_footer ?? null,
          currency: quoteData.currency ?? document.currency,
          fx_rate: quoteData.fx_rate ?? null,
          discount_value: Number(quoteData.discount_value ?? 0),
          discount_type: (quoteData.discount_type ?? "percent") as "percent" | "flat",
          tax_mode: (quoteData.tax_mode ?? "none") as TaxMode,
          tax_rate: Number(quoteData.tax_rate ?? 0),
        }}
        lineItems={quoteData.line_items ?? []}
        clientId={document.client_id}
        projectId={document.project_id}
        clients={clients}
        projects={projects}
        services={services}
        readPaper={
          <DocumentSheetRouter
            document={document}
            variableContext={variableContext}
            lineItems={quoteData.line_items ?? []}
            quoteMeta={{
              version: null,
              validUntil: quoteData.valid_until ?? null,
              currency: document.currency,
              discountValue: Number(quoteData.discount_value ?? 0),
              discountType: (quoteData.discount_type ?? "percent") as "percent" | "flat",
              notesFooter: quoteData.notes_footer ?? null,
              terms: [],
              estimatedStart: null,
              duration: null,
              teamDescription: null,
            }}
          />
        }
        approvalRail={
          !isDraft ? (
            <ApprovalRail
              documentId={document.id}
              kind="quote"
              status={document.status as DocumentStatus}
              approvedAt={quoteData.approved_at}
              declinedAt={quoteData.declined_at}
              approvalMessage={quoteData.approval_message}
              approvalUrl={approvalUrl}
            />
          ) : null
        }
      />
    );
  }

  // ── Proposal ──────────────────────────────────────────────────────────────
  if (document.type === "proposal") {
    if (!proposalData) notFound();
    const isDraft = document.status === "draft";
    const canSwitchToEdit = ["sent", "viewed"].includes(document.status);
    const mode = pickMode({ isDraft, wantEdit, wantRead, canEditWhenSent: canSwitchToEdit });
    const { clients, projects, services } = await loadEditorLists();
    const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const approvalUrl = proposalData.approval_token
      ? approvalLink(proposalData.approval_token, process.env.NEXT_PUBLIC_APP_URL ?? "", "proposal")
      : null;
    return (
      <ProposalEditor
        mode={mode}
        documentTitle={document.title}
        fresh={fresh && isDraft}
        documentId={document.id}
        backHref="/documents/proposals"
        backLabel="Proposals"
        status={document.status as DocumentStatus}
        statusLabel={documentListStatusLabel(document.status as DocumentStatus)}
        statusTone={statusTone(document.status, { overdue: false, settledGood: false })}
        canEditContent={isDraft || canSwitchToEdit}
        canSwitchToEdit={isDraft || canSwitchToEdit}
        editHref={`/documents/${document.id}?edit=1`}
        readHref={`/documents/${document.id}?view=1`}
        kraft={kraftHelp}
        today={new Date().toISOString().slice(0, 10)}
        banner={fresh && isDraft && client ? { clientName: client.company ?? client.name, clientColor: tokenColor(client.id), filled: ["client", document.currency] } : null}
        sentParts={[
          document.sent_at ? `Sent${client?.email ? ` to ${client.email}` : ""} on ${dateLabel(document.sent_at)}` : null,
          document.viewed_at ? `viewed ${dateLabel(document.viewed_at)}` : null,
        ].filter((x): x is string => Boolean(x))}
        editingSentNote={!isDraft ? "This proposal has been sent. You can change the text and cover; pricing is locked." : null}
        newType="proposal"
        actionsEdit={
          <SendProposalButton documentId={document.id} disabled={Boolean(sendBlockedReason)} defaultEmail={client?.email ?? ""} />
        }
        actionsRead={
          <DocumentDetailHeaderActions
            showEdit={false}
            documentId={document.id}
            pdfFilename={pdfFilename}
            documentStatus={document.status}
            isVoided={document.status === "voided"}
            sendButton={<SendProposalButton documentId={document.id} disabled={Boolean(sendBlockedReason)} defaultEmail={client?.email ?? ""} />}
          />
        }
        variableContext={variableContext}
        meta={{
          proposal_number: proposalData.proposal_number ?? null,
          issued: (document.created_at ?? new Date().toISOString()).slice(0, 10),
          valid_until: proposalData.valid_until ?? null,
          notes_footer: proposalData.notes_footer ?? null,
          currency: document.currency,
          discount_value: Number(proposalData.discount_value ?? 0),
          discount_type: (proposalData.discount_type ?? "percent") as "percent" | "flat",
          proposal_content: proposalData.proposal_content ?? { headline: document.title ?? null },
        }}
        contentJson={document.content_json}
        lineItems={proposalData.line_items ?? []}
        clientId={document.client_id}
        projectId={document.project_id}
        clients={clients}
        projects={projects}
        services={services}
        readPaper={
          <DocumentSheetRouter
            document={document}
            variableContext={variableContext}
            lineItems={proposalData.line_items ?? []}
            proposalMeta={{
              version: null,
              headline: proposalData.proposal_content?.headline ?? document.title ?? "Proposal",
              headlineAccent: proposalData.proposal_content?.headline_accent ?? null,
              subhead: proposalData.proposal_content?.subhead ?? null,
              investmentRange: proposalData.proposal_content?.investment_range ?? null,
              contentJson: document.content_json,
            }}
          />
        }
        approvalRail={
          !isDraft ? (
            <ApprovalRail
              documentId={document.id}
              kind="proposal"
              status={document.status as DocumentStatus}
              approvedAt={proposalData.approved_at}
              declinedAt={proposalData.declined_at}
              approvalMessage={proposalData.approval_message}
              approvalUrl={approvalUrl}
              clientId={document.client_id}
              hasProject={Boolean(document.project_id)}
            />
          ) : null
        }
      />
    );
  }

  // ── Receipt ───────────────────────────────────────────────────────────────
  if (document.type === "receipt") {
    if (!voucherData) notFound();
    const money = (n: number) => `${voucherData.currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    return (
      <ReadOnlyWorkspace
        documentId={document.id}
        backHref="/documents/receipts"
        backLabel="Receipts"
        title={voucherData.receiptNumber ?? document.title}
        status={document.status as DocumentStatus}
        statusLabel={documentListStatusLabel(document.status as DocumentStatus)}
        statusTone="success"
        readHref={`/documents/${document.id}?view=1`}
        kraft={kraftHelp}
        today={new Date().toISOString().slice(0, 10)}
        actionsRead={<DownloadPdfButton documentId={document.id} filename={pdfFilename} />}
        readPaper={
          <DocumentSheetRouter
            document={document}
            variableContext={variableContext}
            lineItems={[]}
            voucherMeta={{
              voucherNumber: voucherData.receiptNumber,
              dateReceived: new Date(voucherData.paidAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              paymentMethod: voucherData.method,
              bankReference: voucherData.reference,
              currency: voucherData.currency,
              fxRate:
                voucherData.fxRate != null
                  ? `1 ${voucherData.currency} = ${voucherData.fxRate} ${homeCurrency}`
                  : null,
              amount: voucherData.amount,
              amountInWords: null,
              allocations: voucherData.invoiceNumber
                ? [
                    {
                      documentId: voucherData.invoiceNumber,
                      projectTitle: voucherData.invoiceTitle,
                      issuedDate: "—",
                      invoiceTotal: voucherData.amount,
                      applied: voucherData.amount,
                      balance: 0,
                    },
                  ]
                : [],
              openingBalance: voucherData.amount,
              closingBalance: 0,
              notes: voucherData.notes,
            }}
          />
        }
        rail={
          <RailSection title="Payment">
            <RailField label="Amount" disabled>{money(voucherData.amount)}</RailField>
            <RailField label="Method" disabled>{String(voucherData.method).replace(/_/g, " ")}</RailField>
            {voucherData.reference ? <RailField label="Reference" disabled>{voucherData.reference}</RailField> : null}
            {document.source_document_id ? (
              <Link
                href={`/documents/${document.source_document_id}`}
                className="mt-1 px-2 text-[12px] text-[var(--fg-2)] hover:text-[var(--fg)]"
              >
                Back to the invoice
              </Link>
            ) : null}
          </RailSection>
        }
      />
    );
  }

  // ── Purchase order ─────────────────────────────────────────────────────────
  if (document.type === "local_purchase_order") {
    const isDraft = document.status === "draft";
    const canSwitchToEdit = ["sent", "viewed"].includes(document.status);
    const mode = pickMode({ isDraft, wantEdit, wantRead, canEditWhenSent: canSwitchToEdit });
    const { clients, projects, services } = await loadEditorLists();
    const currency = lpoData?.currency ?? document.currency ?? "USD";
    const pdfUrl = await resolveLpoPdfUrl(document.lpo_pdf_url ?? null);
    return (
      <LpoEditor
        mode={mode}
        documentTitle={document.title}
        fresh={fresh && isDraft}
        documentId={document.id}
        backHref="/documents/purchase-orders"
        backLabel="Purchase orders"
        status={document.status as DocumentStatus}
        statusLabel={documentListStatusLabel(document.status as DocumentStatus)}
        statusTone={statusTone(document.status, { overdue: false, settledGood: false })}
        canEditContent={isDraft}
        canSwitchToEdit={isDraft || canSwitchToEdit}
        editHref={`/documents/${document.id}?edit=1`}
        readHref={`/documents/${document.id}?view=1`}
        kraft={kraftHelp}
        today={new Date().toISOString().slice(0, 10)}
        banner={null}
        sentParts={[]}
        editingSentNote={!isDraft ? "This purchase order has been sent. Only its details can change now." : null}
        newType="local_purchase_order"
        actionsEdit={
          <SendLpoButton documentId={document.id} disabled={Boolean(sendBlockedReason)} defaultEmail={client?.email ?? undefined} />
        }
        actionsRead={
          <DocumentDetailHeaderActions
            showEdit={false}
            documentId={document.id}
            pdfFilename={pdfFilename}
            documentStatus={document.status}
            isVoided={document.status === "voided"}
            sendButton={<SendLpoButton documentId={document.id} disabled={Boolean(sendBlockedReason)} defaultEmail={client?.email ?? undefined} />}
          />
        }
        variableContext={variableContext}
        meta={{
          lpo_number: lpoData?.lpo_number ?? document.lpo_number ?? "",
          issued: (document.created_at ?? new Date().toISOString()).slice(0, 10),
          lpo_validity_date: lpoData?.lpo_validity_date ?? document.lpo_validity_date ?? null,
          lpo_amount: lpoData?.lpo_amount != null ? Number(lpoData.lpo_amount) : document.lpo_amount != null ? Number(document.lpo_amount) : null,
          payment_terms: lpoData?.payment_terms ?? document.payment_terms ?? null,
          currency,
          discount_value: Number(lpoData?.discount_value ?? document.discount_value ?? 0),
          discount_type: (lpoData?.discount_type ?? document.discount_type ?? "percent") as "percent" | "flat",
          tax_mode: (document.tax_mode ?? "none") as TaxMode,
          tax_rate: Number(document.tax_rate ?? 0),
        }}
        lineItems={lpoData?.line_items ?? []}
        clientId={document.client_id}
        projectId={document.project_id}
        clients={clients}
        projects={projects}
        services={services}
        pdfUrl={pdfUrl}
        readPaper={
          <DocumentSheetRouter
            document={document}
            variableContext={variableContext}
            lineItems={lpoData?.line_items ?? []}
            lpoMeta={{
              lpoNumber: lpoData?.lpo_number ?? document.lpo_number,
              lpoAmount: lpoData?.lpo_amount != null ? Number(lpoData.lpo_amount) : document.lpo_amount != null ? Number(document.lpo_amount) : null,
              lpoValidityDate: lpoData?.lpo_validity_date ?? document.lpo_validity_date,
              lpoReferenceNumber: lpoData?.lpo_reference_number ?? document.lpo_reference_number,
              sourceQuoteNumber: lpoData?.source_quote_number ?? null,
              sourceQuoteTitle: lpoData?.source_quote_title ?? null,
              currency,
              discountValue: lpoData?.discount_value ?? document.discount_value ?? 0,
              discountType: lpoData?.discount_type ?? document.discount_type ?? "percent",
              paymentTerms: lpoData?.payment_terms ?? document.payment_terms,
            }}
          />
        }
        billingRail={
          <LpoBillingRail
            documentId={document.id}
            currency={currency}
            progress={lpoBillingProgress}
            linkedInvoices={linkedLPOInvoices}
            pdfUrl={pdfUrl}
          />
        }
      />
    );
  }

  // ── Other (rich text) ──────────────────────────────────────────────────────
  const isDraftOther = document.status === "draft";
  const { clients: otherClients, projects: otherProjects } = await loadEditorLists();
  return (
    <RichTextEditor
      mode={pickMode({ isDraft: isDraftOther, wantEdit, wantRead, canEditWhenSent: document.status !== "voided" })}
      type={document.type}
      documentTitle={document.title}
      fresh={fresh && isDraftOther}
      documentId={document.id}
      backHref="/documents"
      backLabel="Documents"
      status={document.status as DocumentStatus}
      statusLabel={documentListStatusLabel(document.status as DocumentStatus)}
      statusTone={statusTone(document.status, { overdue: false, settledGood: false })}
      canEditContent={document.status !== "voided"}
      canSwitchToEdit={document.status !== "voided"}
      editHref={`/documents/${document.id}?edit=1`}
      readHref={`/documents/${document.id}?view=1`}
      kraft={kraftHelp}
      today={new Date().toISOString().slice(0, 10)}
      actionsEdit={null}
      actionsRead={
        <DocumentDetailHeaderActions
            showEdit={false}
          documentId={document.id}
          pdfFilename={pdfFilename}
          documentStatus={document.status}
          isVoided={document.status === "voided"}
        />
      }
      variableContext={variableContext}
      contentJson={document.content_json}
      clientId={document.client_id}
      projectId={document.project_id}
      clients={otherClients}
      projects={otherProjects}
      readPaper={<DocumentSheetRouter document={document} variableContext={variableContext} lineItems={[]} />}
    />
  );
}

async function resolveLpoPdfUrl(storedUrl: string | null): Promise<string | null> {
  if (!storedUrl) return null;
  if (storedUrl.startsWith("http")) return storedUrl; // legacy public-URL rows
  const { supabase } = await getServerContext();
  const { data: signed } = await supabase.storage
    .from("lpo-documents")
    .createSignedUrl(storedUrl, 60 * 60); // 1 hour
  return signed?.signedUrl ?? null;
}
