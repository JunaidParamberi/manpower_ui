import type { Meta, StoryObj } from "@storybook/react";

import type { VariableContext } from "@/lib/documents/variables";
import type { LineItemRow } from "@/types";
import { LpoSheet } from "./lpo-sheet";

const BASE_CONTEXT: VariableContext = {
  now: new Date("2026-05-06"),
  brand: {
    business_name: "Onyx Ventures",
    primary_color: "#3550E0",
    email_signature: null,
    logo_url: null,
  },
  sender: {
    name: "Dana Cole",
    company_name: "Onyx Ventures",
    email: "dana@onyx.vc",
    address_line1: "228 Lafayette St, 4F",
    address_line2: null,
    city: "New York",
    region: "NY",
    postal_code: "10012",
    country: "USA",
    vat_number: null,
    gstin: null,
    vat_reg_no: null,
  },
  client: {
    name: "Lena Marchetti",
    contact_name: "Lena Marchetti",
    email: "lena@studiomarchetti.ae",
    company: "Studio Marchetti FZ-LLC",
    phone: null,
    address: "DIFC Gate Avenue, Office 412, Dubai",
  },
  project: {
    title: "Onyx — Site v2",
  },
};

const LINE_ITEMS: LineItemRow[] = [
  {
    id: "1",
    document_id: "lpo-1",
    description: "Design system & component library",
      notes: null,
    quantity: 1,
    unit_price: 3200,
    tax_rate: 5,
    sort_order: 1,
    hsn_sac_code: null,
    created_at: "2026-05-06T00:00:00Z",
    updated_at: "2026-05-06T00:00:00Z",
  },
  {
    id: "2",
    document_id: "lpo-1",
    description: "Landing page — responsive build",
      notes: null,
    quantity: 1,
    unit_price: 2800,
    tax_rate: 5,
    sort_order: 2,
    hsn_sac_code: null,
    created_at: "2026-05-06T00:00:00Z",
    updated_at: "2026-05-06T00:00:00Z",
  },
  {
    id: "3",
    document_id: "lpo-1",
    description: "Engineering pairing — capped at 12 sessions",
      notes: null,
    quantity: 12,
    unit_price: 220,
    tax_rate: 5,
    sort_order: 3,
    hsn_sac_code: null,
    created_at: "2026-05-06T00:00:00Z",
    updated_at: "2026-05-06T00:00:00Z",
  },
  {
    id: "4",
    document_id: "lpo-1",
    description: "Post-launch tweaks, QA & contingency",
      notes: null,
    quantity: 1,
    unit_price: 880,
    tax_rate: 5,
    sort_order: 4,
    hsn_sac_code: null,
    created_at: "2026-05-06T00:00:00Z",
    updated_at: "2026-05-06T00:00:00Z",
  },
];

const meta: Meta<typeof LpoSheet> = {
  title: "Documents/Sheets/LpoSheet",
  component: LpoSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Structured Local Purchase Order sheet. Use for client-issued purchase orders generated from approved quotes or created manually, with ordered items, validity metadata, and authorised cap tracking.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LpoSheet>;

export const AuthorisedFromQuote: Story = {
  args: {
    variableContext: BASE_CONTEXT,
    lineItems: LINE_ITEMS,
    lpoNumber: "OX-2026-04",
    issuedDate: "6 May 2026",
    validUntil: "2026-06-30",
    currency: "AED",
    status: "approved",
    lpoAmount: 10000,
    sourceQuoteNumber: "Q-0418",
    paymentTerms: "Net 14",
  },
};

export const Draft: Story = {
  args: {
    ...AuthorisedFromQuote.args,
    status: "draft",
    lpoNumber: "LPO-2026-004",
    lpoAmount: null,
  },
};

export const WithDiscount: Story = {
  args: {
    ...AuthorisedFromQuote.args,
    discountValue: 10,
    discountType: "percent",
    lpoAmount: 9000,
  },
};
