import type { Meta, StoryObj } from "@storybook/react";
import { DeliveryNoteSheet } from "./delivery-note-sheet";
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
  project: { title: "E-Commerce Platform Redesign" },
};

const ITEMS = [
  { description: "Brand Identity Package", subDescription: "Logo in all formats", format: "SVG, PDF, PNG", quantity: 1 },
  { description: "UI Design Files", subDescription: "10 screens + component library", format: "Figma", quantity: 1 },
  { description: "Design System Documentation", subDescription: null, format: "PDF", quantity: 1 },
  { description: "Font licences (variable)", subDescription: null, format: "OTF", quantity: 4 },
];

const CHECKLIST = [
  { text: "All deliverables listed above transferred", isChecked: true },
  { text: "Fonts are licensed for commercial use", isChecked: true },
  { text: "Final invoice INV-0042 settled", isChecked: false },
  { text: "Client has reviewed and accepted all items", isChecked: false },
];

const meta: Meta<typeof DeliveryNoteSheet> = {
  title: "Documents/Sheets/DeliveryNoteSheet",
  component: DeliveryNoteSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Delivery note confirming handover of project deliverables. Not a tax document. Includes items table, acceptance checklist, optional download bundle link, and dual signature block. Typically generated on final delivery before or alongside the last invoice.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DeliveryNoteSheet>;

export const Default: Story = {
  args: {
    variableContext: BASE_CONTEXT,
    deliveryNoteNumber: "DN-0008",
    linkedInvoiceNumber: "INV-0042",
    deliveredDate: "28 May 2026",
    deliveredBy: "Junaid Paramberi",
    receivedBy: null,
    filesCount: "38 items · 412 MB",
    fileFormats: "Figma, PDF, SVG, OTF",
    projectPhase: "Final delivery",
    projectChannel: "manpower.studio/deliver/dn-0008",
    items: ITEMS,
    checklist: CHECKLIST,
    bundleUrl: "manpower.studio/deliver/dn-0008",
    bundleExpiry: "11 Jun 2026",
    bundleHash: null,
    senderIsSigned: true,
    clientSignatureName: "Sara Al Hashimi",
  },
};

export const Unsigned: Story = {
  args: {
    ...Default.args,
    senderIsSigned: false,
  },
};

export const NoBundleLink: Story = {
  name: "No bundle link",
  args: {
    ...Default.args,
    bundleUrl: null,
    bundleExpiry: null,
  },
};

export const AllChecklistComplete: Story = {
  name: "All items accepted",
  args: {
    ...Default.args,
    checklist: CHECKLIST.map((item) => ({ ...item, isChecked: true })),
    senderIsSigned: true,
  },
};
