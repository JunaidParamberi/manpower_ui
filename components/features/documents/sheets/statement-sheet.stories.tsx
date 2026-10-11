import type { Meta, StoryObj } from "@storybook/react";
import { StatementSheet } from "./statement-sheet";
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
    name: "Sara Al Hashimi",
    contact_name: "Sara Al Hashimi",
    email: "sara@nexus.ae",
    company: "Nexus Digital",
    phone: "+971 4 777 0200",
    address: "Media City, Dubai, UAE",
  },
  project: { title: "Retainer Q2 2026" },
};

const TRANSACTIONS = [
  { date: "01 Apr", reference: "INV-0038", description: "Monthly retainer — April 2026", charge: 8000, credit: null, balance: 8000 },
  { date: "05 Apr", reference: "PV-0012", description: "Payment received", charge: null, credit: 8000, balance: 0, isCredit: true },
  { date: "01 May", reference: "INV-0039", description: "Monthly retainer — May 2026", charge: 8000, credit: null, balance: 8000 },
  { date: "02 May", reference: "CN-0002", description: "Credit note adjustment", charge: null, credit: 500, balance: 7500, isCredit: true },
  { date: "01 Jun", reference: "INV-0042", description: "Monthly retainer — June 2026", charge: 8000, credit: null, balance: 15500 },
  { date: "28 May", reference: null, description: "Balance carried forward", charge: null, credit: null, balance: 15500, isClosingRow: true },
];

const PAYMENT_INSTRUCTIONS = [
  { label: "Bank", value: "Emirates NBD" },
  { label: "Account name", value: "Manpower Studio FZ-LLC" },
  { label: "IBAN", value: "AE070260001012345678901", isMono: true },
  { label: "SWIFT", value: "EBILAEAD", isMono: true },
];

const meta: Meta<typeof StatementSheet> = {
  title: "Documents/Sheets/StatementSheet",
  component: StatementSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Account statement showing transaction history across a date range. Includes opening/closing balance, aging analysis bar, full transaction ledger, and payment instructions. Typically generated monthly for ongoing retainer clients.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatementSheet>;

export const ActiveBalance: Story = {
  args: {
    variableContext: BASE_CONTEXT,
    statementNumber: "STMT-2026-05",
    periodLabel: "01 Apr — 28 May 2026",
    issuedDate: "28 May 2026",
    currency: "AED",
    accountManager: "Junaid Paramberi",
    openingBalance: 0,
    totalInvoiced: 24000,
    totalReceived: 8500,
    closingBalance: 15500,
    aging: {
      current: 8000,
      days1to30: 7500,
      days31to60: 0,
      days60plus: 0,
    },
    transactions: TRANSACTIONS,
    paymentInstructions: PAYMENT_INSTRUCTIONS,
    actionRequiredNote: "AED 15,500 outstanding. INV-0039 overdue by 13 days.",
  },
};

export const AllPaid: Story = {
  name: "All paid (zero balance)",
  args: {
    ...ActiveBalance.args,
    statementNumber: "STMT-2026-04",
    periodLabel: "01 Mar — 30 Apr 2026",
    closingBalance: 0,
    totalInvoiced: 16000,
    totalReceived: 16000,
    aging: { current: 0, days1to30: 0, days31to60: 0, days60plus: 0 },
    actionRequiredNote: null,
    transactions: TRANSACTIONS.slice(0, 4),
  },
};

export const Overdue: Story = {
  name: "Overdue balance",
  args: {
    ...ActiveBalance.args,
    statementNumber: "STMT-2026-06",
    closingBalance: 23500,
    aging: {
      current: 8000,
      days1to30: 8000,
      days31to60: 7500,
      days60plus: 0,
    },
    actionRequiredNote: "AED 23,500 outstanding. 2 invoices overdue. Please contact us to discuss.",
  },
};
