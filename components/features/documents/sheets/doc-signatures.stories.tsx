import type { Meta, StoryObj } from "@storybook/react";
import { DocSignatures } from "./doc-signatures";

const meta: Meta<typeof DocSignatures> = {
  title: "Documents/Sheets/DocSignatures",
  component: DocSignatures,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Two-party signature block for contracts and proposals. Shows an unsigned line by default. When `isSigned` is true the line renders in a signed style. Date shows blank placeholder until signed.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocSignatures>;

export const Unsigned: Story = {
  args: {
    signatures: [
      { label: "Authorised by", name: "Junaid Paramberi", role: "Director", date: null, isSigned: false },
      { label: "Accepted by", name: "Mohammed Al Rashidi", role: "CEO, Acme Corp", date: null, isSigned: false },
    ],
  },
};

export const OneSigned: Story = {
  args: {
    signatures: [
      { label: "Authorised by", name: "Junaid Paramberi", role: "Director", date: "28 May 2026", isSigned: true },
      { label: "Accepted by", name: "Mohammed Al Rashidi", role: "CEO, Acme Corp", date: null, isSigned: false },
    ],
  },
};

export const BothSigned: Story = {
  args: {
    signatures: [
      { label: "Authorised by", name: "Junaid Paramberi", role: "Director", date: "28 May 2026", isSigned: true },
      { label: "Accepted by", name: "Mohammed Al Rashidi", role: "CEO, Acme Corp", date: "30 May 2026", isSigned: true },
    ],
  },
};

export const NoRole: Story = {
  args: {
    signatures: [
      { label: "Prepared by", name: "Junaid Paramberi", date: null, isSigned: false },
      { label: "Client signature", name: "Sara Al Hashimi", date: null, isSigned: false },
    ],
  },
};
