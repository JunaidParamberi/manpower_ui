import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PinContextMenu } from "./pin-context-menu";

const meta: Meta<typeof PinContextMenu> = {
  title: "Shared/PinContextMenu",
  component: PinContextMenu,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof PinContextMenu>;

const TriggerRow = (
  <div className="cursor-context-menu rounded-md border border-border bg-card px-4 py-3 text-sm">
    Right-click this row to pin/unpin
  </div>
);

export const Unpinned: Story = {
  render: () => (
    <PinContextMenu
      itemType="project"
      itemId="p1a2b3c4-d5e6-7890-abcd-ef1234567890"
      itemLabel="Brand Refresh 2026"
      itemHref="/projects/p1a2b3c4-d5e6-7890-abcd-ef1234567890"
      isPinned={false}
    >
      {TriggerRow}
    </PinContextMenu>
  ),
};

export const Pinned: Story = {
  render: () => (
    <PinContextMenu
      itemType="client"
      itemId="c1a2b3c4-d5e6-7890-abcd-ef1234567890"
      itemLabel="Acme Design Co."
      itemHref="/clients/c1a2b3c4-d5e6-7890-abcd-ef1234567890"
      isPinned
    >
      {TriggerRow}
    </PinContextMenu>
  ),
};
