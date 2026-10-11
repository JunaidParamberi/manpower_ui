import type { Meta, StoryObj } from "@storybook/react";
import { DocumentPaper } from "./document-paper";
import type { VariableContext } from "@/lib/documents/variables";
import type { LineItemRow, TiptapDoc } from "@/types";

const BASE_CONTEXT: VariableContext = {
  now: new Date("2026-05-28"),
  brand: {
    business_name: "Manpower Studio",
    primary_color: "#4F6EF7",
    email_signature: null,
    logo_url: null,
  },
  sender: {
    name: "Junaid Paramberi",
    company_name: "Manpower Studio FZ-LLC",
    email: "junaid@manpower.studio",
    address_line1: "Level 14, Tower A, DIFC",
    address_line2: null,
    city: "Dubai",
    region: null,
    postal_code: null,
    country: "UAE",
    vat_number: "100234567890003",
    gstin: null,
    vat_reg_no: null,
  },
  client: {
    name: "Mohammed Al Rashidi",
    contact_name: "Mohammed Al Rashidi",
    email: "m.rashidi@acme.ae",
    company: "Acme Corp",
    phone: "+971 4 555 0100",
    address: "PO Box 1234, Business Bay, Dubai, UAE",
  },
  project: { title: "Brand Identity & Website" },
};

const LINE_ITEMS: LineItemRow[] = [
  {
    id: "1",
    document_id: "doc-1",
    description: "Brand Identity Design",
      notes: null,
    quantity: 1,
    unit_price: 4500,
    tax_rate: 5,
    sort_order: 1,
    hsn_sac_code: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  },
  {
    id: "2",
    document_id: "doc-1",
    description: "Website Design (5 pages)",
      notes: null,
    quantity: 1,
    unit_price: 3200,
    tax_rate: 5,
    sort_order: 2,
    hsn_sac_code: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  },
  {
    id: "3",
    document_id: "doc-1",
    description: "Revision rounds",
      notes: null,
    quantity: 3,
    unit_price: 500,
    tax_rate: 5,
    sort_order: 3,
    hsn_sac_code: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  },
];

const PROPOSAL_CONTENT: TiptapDoc = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "About this project" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Nexus Digital has grown rapidly over the past 18 months. This proposal outlines a focused redesign to support the next phase of growth, with a strong focus on conversion and brand cohesion.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "What we'll deliver" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "UX research & journey mapping" }] }],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "High-fidelity UI design for 10 screens" }] }],
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Design system documentation" }] }],
        },
      ],
    },
  ],
};

const meta: Meta<typeof DocumentPaper> = {
  title: "Documents/DocumentPaper",
  component: DocumentPaper,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The in-app document preview card — a styled white card rendering a complete document (invoice, quote, proposal, payment voucher). Used inside the editor preview panel and document detail view. Not the print/PDF sheet; use the Sheet components for PDF output. Shows brand colour accent line, header, parties, line items, and footer in a web-native layout.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentPaper>;

export const Invoice: Story = {
  args: {
    document: {
      id: "doc-1",
      type: "invoice",
      title: "Brand Identity & Website",
      created_at: "2026-05-01T00:00:00Z",
      status: "sent",
      invoice_number: "INV-0042",
    },
    variableContext: BASE_CONTEXT,
    lineItems: LINE_ITEMS,
    docMeta: {
      due_date: "2026-06-11",
      payment_terms: "Net 14",
      notes_footer: "Thank you for your business. Please include the invoice number in your payment reference.",
      discount_value: 0,
      discount_type: "percent",
    },
    currency: "AED",
  },
};

export const InvoiceWithDiscount: Story = {
  name: "Invoice with 10% discount",
  args: {
    ...Invoice.args,
    docMeta: {
      due_date: "2026-06-11",
      payment_terms: "Net 14",
      notes_footer: null,
      discount_value: 10,
      discount_type: "percent",
    },
  },
};

export const InvoicePaid: Story = {
  name: "Invoice (paid)",
  args: {
    ...Invoice.args,
    document: {
      ...Invoice.args!.document!,
      status: "paid",
    },
  },
};

export const Quote: Story = {
  args: {
    document: {
      id: "doc-2",
      type: "quote",
      title: "E-Commerce Platform Redesign",
      created_at: "2026-05-20T00:00:00Z",
      status: "draft",
      quote_number: "QT-0012",
    },
    variableContext: {
      ...BASE_CONTEXT,
      client: {
        name: "Sara Al Hashimi",
        contact_name: "Sara Al Hashimi",
        email: "sara@nexus.ae",
        company: "Nexus Digital",
        phone: "+971 4 777 0200",
        address: "Media City, Dubai, UAE",
      },
      project: { title: "E-Commerce Platform Redesign" },
    },
    lineItems: LINE_ITEMS,
    docMeta: {
      valid_until: "2026-06-03",
      notes_footer: "Prices valid for 14 days. 50% deposit required to begin.",
      discount_value: 0,
      discount_type: "percent",
    },
    currency: "AED",
  },
};

export const Proposal: Story = {
  args: {
    document: {
      id: "doc-3",
      type: "proposal",
      title: "E-Commerce Platform Redesign",
      created_at: "2026-05-28T00:00:00Z",
      status: "draft",
    },
    variableContext: {
      ...BASE_CONTEXT,
      client: {
        name: "Sara Al Hashimi",
        contact_name: "Sara Al Hashimi",
        email: "sara@nexus.ae",
        company: "Nexus Digital",
        phone: null,
        address: "Media City, Dubai",
      },
      project: { title: "E-Commerce Platform Redesign" },
    },
    lineItems: LINE_ITEMS,
    content: PROPOSAL_CONTENT,
    docMeta: {
      discount_value: 0,
      discount_type: "percent",
    },
    currency: "AED",
  },
};

export const Receipt: Story = {
  args: {
    document: {
      id: "doc-4",
      type: "receipt",
      title: "Payment for INV-0042",
      created_at: "2026-05-28T00:00:00Z",
      status: "paid",
      receipt_number: "RCT-0015",
    },
    variableContext: BASE_CONTEXT,
    voucherData: {
      receiptNumber: "RCT-0015",
      paidAt: "2026-05-28T00:00:00Z",
      amount: 9200,
      currency: "AED",
      method: "Bank transfer",
      reference: "TXN-AE070260001-28052026",
      notes: "Payment received in full.",
      invoiceTitle: "Brand Identity & Website",
      invoiceNumber: "INV-0042",
    },
    currency: "AED",
  },
};

export const CustomBrandColor: Story = {
  name: "Custom brand colour (amber)",
  args: {
    ...Invoice.args,
    variableContext: {
      ...BASE_CONTEXT,
      brand: {
        business_name: "Studio Amber",
        primary_color: "#D97706",
        email_signature: null,
        logo_url: null,
      },
    },
  },
};

export const NoBrand: Story = {
  name: "No brand (sender fallback)",
  args: {
    ...Invoice.args,
    variableContext: {
      ...BASE_CONTEXT,
      brand: null,
    },
  },
};

export const NoClient: Story = {
  name: "No client set",
  args: {
    ...Invoice.args,
    variableContext: {
      ...BASE_CONTEXT,
      client: null,
    },
  },
};
