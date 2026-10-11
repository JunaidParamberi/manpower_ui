import type { Meta, StoryObj } from "@storybook/react";
import { CreditNoteSheet } from "./credit-note-sheet";
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
    address_line1: "DIFC, Dubai",
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
    address: "Business Bay, Dubai, UAE",
  },
  project: { title: "Brand Identity" },
};

const LINE_ITEMS: LineItemRow[] = [
  {
    id: "1",
    document_id: "cn-1",
    description: "Unused revision rounds (2 of 3)",
      notes: null,
    quantity: 2,
    unit_price: 500,
    tax_rate: 5,
    sort_order: 1,
    hsn_sac_code: null,
    created_at: "2026-05-28T00:00:00Z",
    updated_at: "2026-05-28T00:00:00Z",
  },
];

const meta: Meta<typeof CreditNoteSheet> = {
  title: "Documents/Sheets/CreditNoteSheet",
  component: CreditNoteSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Credit note sheet issued against an existing invoice. Uses a red-tinted credit band instead of DocHeader. Shows original vs credited amounts in a refund card. Use when partially or fully reversing a paid invoice.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CreditNoteSheet>;

export const Default: Story = {
  args: {
    variableContext: BASE_CONTEXT,
    creditNoteNumber: "CN-0003",
    againstInvoiceNumber: "INV-0041",
    issuedDate: "28 May 2026",
    reason: "Unused revision rounds refunded",
    currency: "AED",
    originalInvoiceAmount: 9200,
    lineItems: LINE_ITEMS,
    appliedAsMethod: "Bank transfer to original payment source",
    appliedAsStatus: "Refund processing (3–5 business days)",
    appliedAsAlternative: "Or applied as credit on next invoice",
    notesFooter: "This credit note cancels AED 1,000 of INV-0041. Retain for VAT records.",
  },
};

export const FullRefund: Story = {
  name: "Full invoice reversal",
  args: {
    ...Default.args,
    creditNoteNumber: "CN-0002",
    againstInvoiceNumber: "INV-0038",
    reason: "Project cancelled before delivery",
    lineItems: [
      {
        id: "1",
        document_id: "cn-2",
        description: "Brand Identity Design",
      notes: null,
        quantity: 1,
        unit_price: 4500,
        tax_rate: 5,
        sort_order: 1,
    hsn_sac_code: null,
        created_at: "2026-05-28T00:00:00Z",
        updated_at: "2026-05-28T00:00:00Z",
      },
      {
        id: "2",
        document_id: "cn-2",
        description: "Website Design (5 pages)",
      notes: null,
        quantity: 1,
        unit_price: 4700,
        tax_rate: 5,
        sort_order: 2,
    hsn_sac_code: null,
        created_at: "2026-05-28T00:00:00Z",
        updated_at: "2026-05-28T00:00:00Z",
      },
    ],
    originalInvoiceAmount: 9200,
  },
};

export const NoInvoiceReference: Story = {
  name: "No linked invoice",
  args: {
    ...Default.args,
    againstInvoiceNumber: null,
    creditNoteNumber: "CN-0001",
    reason: "Goodwill credit",
  },
};
