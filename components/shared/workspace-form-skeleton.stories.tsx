import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WorkspaceFormSkeleton } from "./workspace-form-skeleton";

const meta = {
  title: "Shared/WorkspaceFormSkeleton",
  component: WorkspaceFormSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Skeleton loading state for workspace-style forms. It mirrors the main form sections and sticky insight rail to prevent layout shift while server data loads.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WorkspaceFormSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClientForm: Story = {
  args: {
    variant: "client",
  },
};

export const ProjectForm: Story = {
  args: {
    variant: "project",
  },
};
