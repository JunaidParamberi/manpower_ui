import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { GlobalSearchDocumentResult } from "@/lib/search/types";

import { CommandPaletteResultRow } from "./command-palette-result-row";

const meta: Meta<typeof CommandPaletteResultRow> = {
  title: "Layout/CommandPaletteResultRow",
  component: CommandPaletteResultRow,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CommandPaletteResultRow>;

export const Client: Story = {
  args: {
    result: {
      kind: "client",
      id: "c1",
      label: "Acme Corp",
      subtitle: "hello@acme.test",
      href: "/clients/c1",
    },
  },
};

export const Project: Story = {
  args: {
    result: {
      kind: "project",
      id: "p1",
      label: "Website redesign",
      subtitle: "Acme Corp · In progress",
      href: "/projects?project=p1",
      status: "In progress",
    },
  },
};

export const Document: Story = {
  args: {
    result: {
      kind: "document",
      id: "d1",
      label: "INV-0042",
      subtitle: "Invoice · Acme Corp",
      href: "/documents/d1",
      documentType: "invoice",
      typeBadge: "INV",
      status: "sent",
      statusLabel: "Sent",
    } satisfies GlobalSearchDocumentResult,
  },
};
