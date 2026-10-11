import type { Meta, StoryObj } from "@storybook/react";
import { ReceiptSheet } from "./receipt-sheet";
import type { VariableContext } from "@/lib/documents/variables";

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
  project: { title: "Brand Identity & Website" },
};

const ALLOCATIONS = [
  {
    documentId: "inv-42",
    projectTitle: "Brand Identity & Website",
    issuedDate: "01 May 2026",
    invoiceTotal: 9200,
    applied: 9200,
    balance: 0,
  },
];

const meta: Meta<typeof ReceiptSheet> = {
  title: "Documents/Sheets/ReceiptSheet",
  component: ReceiptSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Payment received confirmation receipt. Shows payment amount, method, bank reference, invoice allocations, and running balance. Dual-signature block for sender and client. Generated automatically when an invoice is marked paid.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReceiptSheet>;

export const BankTransfer: Story = {
  args: {
    variableContext: BASE_CONTEXT,
    voucherNumber: "RCT-0015",
    dateReceived: "28 May 2026",
    paymentMethod: "Bank transfer",
    bankReference: "TXN-AE070260001-28052026",
    currency: "AED",
    fxRate: null,
    amount: 9200,
    amountInWords: "Nine thousand two hundred dirhams only",
    allocations: ALLOCATIONS,
    openingBalance: 9200,
    closingBalance: 0,
    notes: "Payment received in full. Thank you.",
  },
};

export const FxPayment: Story = {
  name: "Foreign currency (GBP → AED)",
  args: {
    ...BankTransfer.args,
    voucherNumber: "RCT-0016",
    currency: "AED",
    fxRate: "1 GBP = 4.6121 AED",
    amount: 9200,
    amountInWords: "Equivalent to GBP 1,994.00 at rate 4.6121",
    paymentMethod: "International wire",
    bankReference: "SWIFT-EBILAEAD-28052026",
  },
};

export const PartialPayment: Story = {
  name: "Partial payment",
  args: {
    ...BankTransfer.args,
    voucherNumber: "RCT-0014",
    amount: 4600,
    amountInWords: "Four thousand six hundred dirhams only",
    allocations: [
      {
        documentId: "inv-42",
        projectTitle: "Brand Identity & Website",
        issuedDate: "01 May 2026",
        invoiceTotal: 9200,
        applied: 4600,
        balance: 4600,
      },
    ],
    openingBalance: 9200,
    closingBalance: 4600,
    notes: "Deposit 50%. Remaining balance due on final delivery.",
  },
};
