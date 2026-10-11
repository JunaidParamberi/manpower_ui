import type { Meta, StoryObj } from "@storybook/react";
import { DocParties } from "./doc-parties";

const meta: Meta<typeof DocParties> = {
  title: "Documents/Sheets/DocParties",
  component: DocParties,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Party info section between the header and line items. Renders 2 or 3 columns: typically Bill To / Bill From / Project Details. Use `detailsGrid` for structured key-value data (dates, terms, PO refs). Use plain `lines` for address blocks.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocParties>;

export const InvoiceThreeCol: Story = {
  name: "Invoice (3 col)",
  args: {
    layout: "3col",
    columns: [
      {
        label: "Bill To",
        name: "Acme Corp",
        lines: ["Mohammed Al Rashidi", "PO Box 1234, Business Bay", "Dubai, UAE"],
      },
      {
        label: "Bill From",
        name: "Manpower Studio FZ-LLC",
        lines: ["Junaid Paramberi", "DIFC, Dubai, UAE", "TRN: 100234567890003"],
      },
      {
        label: "Invoice Details",
        detailsGrid: [
          { label: "Invoice no.", value: "INV-0042" },
          { label: "Issued", value: "14 May 2026" },
          { label: "Due", value: "28 May 2026", bold: true },
          { label: "Terms", value: "Net 14" },
          { label: "Currency", value: "AED", mono: true },
        ],
      },
    ],
  },
};

export const QuoteTwoCol: Story = {
  name: "Quote (2 col)",
  args: {
    layout: "2col",
    columns: [
      {
        label: "Prepared For",
        name: "Nexus Digital",
        lines: ["Sara Al Hashimi", "Media City, Dubai"],
      },
      {
        label: "Quote Details",
        detailsGrid: [
          { label: "Quote no.", value: "QT-0012" },
          { label: "Date", value: "28 May 2026" },
          { label: "Valid until", value: "11 Jun 2026" },
          { label: "Currency", value: "AED", mono: true },
        ],
      },
    ],
  },
};

export const SimpleAddress: Story = {
  name: "Simple address lines",
  args: {
    layout: "2col",
    columns: [
      {
        label: "Delivered To",
        name: "Tech Ventures LLC",
        lines: ["Unit 5B, JLT Cluster M", "Jumeirah Lakes Towers", "Dubai, UAE"],
      },
      {
        label: "Supplier",
        name: "Manpower Studio",
        lines: ["DIFC, Level 14", "Dubai, UAE"],
      },
    ],
  },
};
