import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClientPinnedNote } from "./client-pinned-note";

/** The client's pinned note in the About tab. Edit goes to the client form. Not for task or project notes. */
const meta: Meta<typeof ClientPinnedNote> = {
  title: "Features/Clients/ClientPinnedNote",
  component: ClientPinnedNote,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClientPinnedNote>;

export const Default: Story = {
  args: {
    notes:
      "Preferred client. Net-30 terms. Avoid afternoon meetings on Fridays — they observe a quiet day.",
    editHref: "/clients/c1/edit",
    updatedAtLabel: "Updated 3 days ago",
  },
};

export const NoTimestamp: Story = {
  args: {
    notes: "VIP client. Always cc their assistant on invoices.",
    editHref: "/clients/c1/edit",
  },
};
