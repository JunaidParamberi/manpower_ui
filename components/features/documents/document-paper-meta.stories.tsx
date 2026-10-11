import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DocumentPaperMeta } from "./document-paper-meta";

const sender = {
  name: "John Doe",
  company_name: "Manpower Studio",
  address_line1: "123 Sheikh Zayed Rd",
  address_line2: null,
  city: "Dubai",
  region: null,
  postal_code: null,
  country: "UAE",
  email: "john@manpower.studio.com",
  vat_number: "100123456700003",
  gstin: null,
  vat_reg_no: null,
};

const client = {
  name: "Jane Smith",
  contact_name: "Jane Smith",
  company: "Acme Design Co.",
  address: "Dubai Marina, Dubai, UAE",
  email: "hello@acmedesign.co",
  phone: "+971 50 123 4567",
};

const meta: Meta<typeof DocumentPaperMeta> = {
  title: "Features/Documents/DocumentPaperMeta",
  component: DocumentPaperMeta,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ background: "#fff", maxWidth: 800 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentPaperMeta>;

export const Invoice: Story = {
  args: {
    sender,
    client,
    issuedDate: "May 15, 2026",
    detailRows: [
      { label: "Invoice #", value: "INV-0042" },
      { label: "Due", value: "Jun 15, 2026" },
      { label: "Terms", value: "Net 30" },
    ],
  },
};

export const Quote: Story = {
  args: {
    sender,
    client,
    issuedDate: "May 18, 2026",
    detailRows: [
      { label: "Quote #", value: "QUO-0012" },
      { label: "Valid until", value: "Jun 18, 2026" },
    ],
  },
};
