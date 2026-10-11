import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FileText, Users, FolderOpen } from "lucide-react";

import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof EmptyState> = {
  title: "Shared/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    headline: "No documents yet",
    description: "Create your first invoice, quote, or proposal to get started.",
  },
};

export const WithAction: Story = {
  args: {
    icon: FileText,
    headline: "No invoices",
    description: "Create your first invoice to start tracking payments.",
    action: <Button>Create Invoice</Button>,
  },
};

export const CustomIcon: Story = {
  args: {
    icon: Users,
    headline: "No clients",
    description: "Add your first client to begin managing projects.",
    action: <Button variant="outline">Add Client</Button>,
  },
};

export const MinimalNoDescription: Story = {
  args: {
    icon: FolderOpen,
    headline: "Nothing here",
  },
};
