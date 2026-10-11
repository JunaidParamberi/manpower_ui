import type { Meta, StoryObj } from "@storybook/react";
import { QuoteSheet } from "./quote-sheet";
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
    name: "Sara Al Hashimi",
    contact_name: "Sara Al Hashimi",
    email: "sara@nexus.ae",
    company: "Nexus Digital",
    phone: "+971 4 777 0200",
    address: "Media City, Dubai, UAE",
  },
  project: { title: "E-Commerce Platform Redesign" },
};

const LINE_ITEMS: LineItemRow[] = [
  {
    id: "1",
    document_id: "doc-2",
    description: "UX Research & Wireframes",
      notes: null,
    quantity: 1,
    unit_price: 3500,
    tax_rate: 5,
    sort_order: 1,
    hsn_sac_code: null,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
  },
  {
    id: "2",
    document_id: "doc-2",
    description: "UI Design (10 screens)",
      notes: null,
    quantity: 1,
    unit_price: 5000,
    tax_rate: 5,
    sort_order: 2,
    hsn_sac_code: null,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
  },
  {
    id: "3",
    document_id: "doc-2",
    description: "Design system documentation",
      notes: null,
    quantity: 1,
    unit_price: 1200,
    tax_rate: 5,
    sort_order: 3,
    hsn_sac_code: null,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
  },
];

const TERMS = [
  "50% deposit required before work begins.",
  "Remaining 50% due on final delivery.",
  "Up to 2 revision rounds included.",
  "Additional revisions billed at AED 500/round.",
];

const meta: Meta<typeof QuoteSheet> = {
  title: "Documents/Sheets/QuoteSheet",
  component: QuoteSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full quote document sheet. Includes validity banner, scope table with optional items, terms section, and totals. When optional items exist, totals shows a secondary 'with optionals' line.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuoteSheet>;

export const Draft: Story = {
  args: {
    variableContext: BASE_CONTEXT,
    lineItems: LINE_ITEMS,
    quoteNumber: "QT-0012",
    version: 1,
    issuedDate: "28 May 2026",
    validUntil: "2026-06-11",
    currency: "AED",
    status: null,
    terms: TERMS,
    estimatedStart: "15 June 2026",
    duration: "6 weeks",
    notesFooter: "Prices valid for 14 days from issue date.",
  },
};

export const Version2: Story = {
  name: "Version 2 (revised)",
  args: {
    ...Draft.args,
    version: 2,
    status: "sent",
  },
};

export const Expired: Story = {
  args: {
    ...Draft.args,
    validUntil: "2026-05-10",
    status: "expired",
  },
};

export const WithOptionalItems: Story = {
  name: "With optional add-ons",
  args: {
    ...Draft.args,
    lineItems: [
      ...LINE_ITEMS,
      {
        id: "4",
        document_id: "doc-2",
        description: "Social media kit (10 templates)",
      notes: null,
        quantity: 1,
        unit_price: 1800,
        tax_rate: 5,
        sort_order: 4,
    hsn_sac_code: null,
        is_optional: true,
        created_at: "2026-05-20T00:00:00Z",
        updated_at: "2026-05-20T00:00:00Z",
      } as LineItemRow & { is_optional: boolean },
    ],
  },
};

export const NoValidityDate: Story = {
  name: "No validity date",
  args: {
    ...Draft.args,
    validUntil: null,
  },
};
