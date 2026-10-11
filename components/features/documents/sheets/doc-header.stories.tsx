import type { Meta, StoryObj } from "@storybook/react";
import { DocHeader } from "./doc-header";

const BRAND = {
  logoUrl: null,
  businessName: "Manpower Studio",
  primaryColor: "#4F6EF7",
  email: "hello@manpower.studio",
  phone: "+971 50 123 4567",
  addressLine1: "Level 14, Tower A, DIFC",
  addressLine2: null,
  city: "Dubai",
  vatNumber: "100234567890003",
};

const SENDER = {
  name: "Junaid Paramberi",
  companyName: "Manpower Studio FZ-LLC",
  email: "junaid@manpower.studio",
  addressLine1: "DIFC, Dubai",
  addressLine2: null,
  city: "Dubai",
  region: null,
  postalCode: null,
  country: "UAE",
  vatNumber: "100234567890003",
};

const meta: Meta<typeof DocHeader> = {
  title: "Documents/Sheets/DocHeader",
  component: DocHeader,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Top section of every document sheet. Shows brand/sender identity on left, document type + number + status on right. Use `brand` when the user has set up business branding; fall back to `sender` for basic profile details.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocHeader>;

export const Invoice: Story = {
  args: {
    brand: BRAND,
    sender: SENDER,
    docType: "INVOICE",
    docNumber: "INV-0042",
    status: "Sent · awaiting payment",
    statusVariant: "accent",
  },
};

export const Paid: Story = {
  args: {
    brand: BRAND,
    sender: SENDER,
    docType: "INVOICE",
    docNumber: "INV-0041",
    status: "Paid",
    statusVariant: "success",
  },
};

export const Overdue: Story = {
  args: {
    brand: BRAND,
    sender: SENDER,
    docType: "INVOICE",
    docNumber: "INV-0039",
    status: "Overdue",
    statusVariant: "warn",
  },
};

export const Proposal: Story = {
  args: {
    brand: BRAND,
    sender: SENDER,
    docType: "PROPOSAL",
    docNumber: "PROP-0007",
    docNumberSub: "v2",
    status: null,
  },
};

export const NoBrand: Story = {
  name: "No brand (sender only)",
  args: {
    brand: null,
    sender: SENDER,
    docType: "QUOTE",
    docNumber: "QT-0012",
    status: "Draft",
    statusVariant: "default",
  },
};
