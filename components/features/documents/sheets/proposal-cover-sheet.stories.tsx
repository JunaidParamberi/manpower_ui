import type { Meta, StoryObj } from "@storybook/react";
import { ProposalCoverSheet } from "./proposal-cover-sheet";
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
    phone: null,
    address: null,
  },
  project: { title: "E-Commerce Platform Redesign" },
};

const meta: Meta<typeof ProposalCoverSheet> = {
  title: "Documents/Sheets/ProposalCoverSheet",
  component: ProposalCoverSheet,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Cover page for a multi-page proposal document. Renders a large headline with optional accent word, subhead, client/project context, investment range, and prepared-by details. Always the first page — followed by ProposalContentSheet pages.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProposalCoverSheet>;

export const Default: Story = {
  args: {
    variableContext: BASE_CONTEXT,
    proposalNumber: "PROP-0007",
    version: 1,
    headline: "A bold new direction for Nexus Digital",
    headlineAccent: "bold",
    subhead: "E-Commerce Platform Redesign — UX, Design & Brand Alignment",
    clientName: "Nexus Digital",
    projectName: "E-Commerce Platform Redesign",
    investmentRange: "AED 9,700 – 11,500",
    preparedByName: "Junaid Paramberi",
    preparedByRole: "Creative Director, Manpower Studio",
    issuedDate: "28 May 2026",
    validDays: 30,
    totalPages: 6,
  },
};

export const Version2: Story = {
  name: "Version 2",
  args: {
    ...Default.args,
    version: 2,
    headline: "A refined proposal for Nexus Digital",
    headlineAccent: "refined",
    investmentRange: "AED 10,200 – 12,000",
  },
};

export const NoAccentWord: Story = {
  name: "No accent word",
  args: {
    ...Default.args,
    headline: "E-Commerce Platform Redesign",
    headlineAccent: null,
    subhead: null,
  },
};

export const NoInvestmentRange: Story = {
  name: "No investment range",
  args: {
    ...Default.args,
    investmentRange: null,
  },
};
