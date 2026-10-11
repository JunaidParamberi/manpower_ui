import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Inbox, FileText, Users } from "lucide-react";

import { EmptyStateCard } from "./empty-state-card";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof EmptyStateCard> = {
  title: "Shared/EmptyStateCard",
  component: EmptyStateCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyStateCard>;

export const Default: Story = {
  args: {
    icon: Inbox,
    title: "No items yet",
    description: "Create your first item to get started.",
  },
};

export const WithAction: Story = {
  args: {
    icon: FileText,
    title: "No documents",
    description: "Create your first invoice, quote, or proposal to begin.",
    action: <Button>Create Document</Button>,
  },
};

export const Clients: Story = {
  args: {
    icon: Users,
    title: "No clients yet",
    description: "Add your first client to begin managing projects and invoices.",
    action: <Button variant="outline">Add Client</Button>,
  },
};
