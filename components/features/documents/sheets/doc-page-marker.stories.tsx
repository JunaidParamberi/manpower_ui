import type { Meta, StoryObj } from "@storybook/react";
import { DocPageMarker } from "./doc-page-marker";

const meta: Meta<typeof DocPageMarker> = {
  title: "Documents/Sheets/DocPageMarker",
  component: DocPageMarker,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Footer pagination strip rendered at the bottom of each document page. Left slot shows document identifier (e.g. invoice number), right slot shows page count.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocPageMarker>;

export const Default: Story = {
  args: { left: "INV-0042", right: "Page 1 of 1" },
};

export const MultiPage: Story = {
  args: { left: "PROP-0007", right: "Page 2 of 4" },
};

export const EmptyLeft: Story = {
  args: { left: "", right: "Page 1 of 1" },
};
