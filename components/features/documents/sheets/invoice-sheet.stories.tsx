import type { Meta, StoryObj } from "@storybook/react";
import { InvoiceSheet } from "./invoice-sheet";
import type { VariableContext } from "@/lib/documents/variables";
import type { LineItemRow } from "@/types";

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

const PAYMENT_INSTRUCTIONS = [
  { label: "Bank", value: "Emirates NBD" },
  { label: "Account name", value: "Manpower Studio FZ-LLC" },
  { label: "IBAN", value: "AE070260001012345678901", isMono: true },
  { label: "SWIFT", value: "EBILAEAD", isMono: true },
];

const meta: Meta<typeof InvoiceSheet> = {
  title: "Documents/Sheets/InvoiceSheet",
  component: InvoiceSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full invoice document sheet. Composes DocHeader, DocParties, DocLineItems, DocTotals, and DocFooter into a paginated A4-style layout. Accepts a `VariableContext` and flat `LineItemRow[]` — no Supabase calls inside the component.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InvoiceSheet>;

export const Draft: Story = {
  args: {
    variableContext: BASE_CONTEXT,
    lineItems: LINE_ITEMS,
    invoiceNumber: "INV-0042",
    issuedDate: "28 May 2026",
    dueDate: "2026-06-11",
    paymentTerms: "Net 14",
    currency: "AED",
    status: null,
    paymentInstructions: PAYMENT_INSTRUCTIONS,
    notesFooter: "Thank you for your business.",
  },
};

export const Sent: Story = {
  args: {
    ...Draft.args,
    status: "sent",
  },
};

export const Paid: Story = {
  args: {
    ...Draft.args,
    status: "paid",
  },
};

export const Overdue: Story = {
  args: {
    ...Draft.args,
    status: "overdue",
    dueDate: "2026-05-01",
  },
};

export const WithDiscount: Story = {
  args: {
    ...Draft.args,
    discountValue: 10,
    discountType: "percent",
    status: "sent",
  },
};

export const BrandColor: Story = {
  name: "Custom brand color",
  args: {
    ...Draft.args,
    status: "sent",
    variableContext: {
      ...BASE_CONTEXT,
      brand: {
        ...BASE_CONTEXT.brand!,
        primary_color: "#E85D4C",
      },
    },
  },
};

export const MinimalNoPaymentInstructions: Story = {
  name: "Minimal (no payment instructions)",
  args: {
    variableContext: { ...BASE_CONTEXT, brand: null, project: null },
    lineItems: LINE_ITEMS.slice(0, 1),
    invoiceNumber: "INV-0001",
    issuedDate: "28 May 2026",
    dueDate: null,
    paymentTerms: null,
    currency: "USD",
    status: null,
  },
};

/** India invoice with GST (CGST+SGST) and 10% TDS deduction. */
export const TDSEnabled: Story = {
  name: "India — TDS deduction enabled",
  args: {
    variableContext: {
      ...BASE_CONTEXT,
      sender: {
        ...BASE_CONTEXT.sender!,
        country: "India",
        vat_number: null,
        gstin: "29ABCDE1234F1Z5",
        vat_reg_no: null,
      },
      client: {
        ...BASE_CONTEXT.client!,
        company: "Tata Consultancy Services",
        name: "Priya Sharma",
        contact_name: "Priya Sharma",
        email: "priya@tcs.com",
        address: "B Wing, Nirlon Complex, Goregaon East, Mumbai 400063",
      },
    },
    lineItems: [
      {
        id: "1",
        document_id: "doc-in-1",
        description: "UI/UX Design Services",
      notes: null,
        quantity: 1,
        unit_price: 100000,
        tax_rate: 18,
        sort_order: 1,
        hsn_sac_code: "998391",
        created_at: "2026-05-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z",
      },
    ],
    invoiceNumber: "INV-IN-0007",
    issuedDate: "28 May 2026",
    dueDate: "2026-06-11",
    paymentTerms: "Net 14",
    currency: "INR",
    status: "sent",
    taxMode: "cgst_sgst",
    taxRate: 18,
    tdsEnabled: true,
    tdsRate: 10,
    notesFooter: "TDS certificate (Form 16A) to be furnished within 15 days.",
  },
};
