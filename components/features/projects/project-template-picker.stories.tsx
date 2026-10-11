import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { ProjectTemplateSummaryRow } from "@/types";

import { ProjectTemplatePicker } from "./project-template-picker";

const systemTemplates: ProjectTemplateSummaryRow[] = [
  {
    id: "s1",
    user_id: null,
    is_system: true,
    name: "Website redesign",
    description: "Discovery through launch for a client website project.",
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
    milestone_count: 4,
    task_count: 11,
  },
  {
    id: "s2",
    user_id: null,
    is_system: true,
    name: "Brand identity sprint",
    description: "Research, concepts, refinement, and final brand delivery.",
    created_at: "2026-05-15T10:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",
    milestone_count: 4,
    task_count: 8,
  },
];

const userTemplates: ProjectTemplateSummaryRow[] = [
  {
    id: "u1",
    user_id: "user-1",
    is_system: false,
    name: "Acme retainer",
    description: "Monthly work for Acme Corp.",
    created_at: "2026-04-01T10:00:00Z",
    updated_at: "2026-04-01T10:00:00Z",
    milestone_count: 3,
    task_count: 6,
  },
];

const meta: Meta<typeof ProjectTemplatePicker> = {
  title: "Features/Projects/ProjectTemplatePicker",
  component: ProjectTemplatePicker,
  parameters: {
    docs: {
      description: {
        component:
          "Card grid to pick a Manpower starter or saved project template when creating a new project. Blank project clears the selection. Milestones and tasks seed after the project is created.",
      },
    },
  },
  args: {
    onChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof ProjectTemplatePicker>;

export const WithSystemAndUserTemplates: Story = {
  args: {
    templates: [...systemTemplates, ...userTemplates],
    selectedId: null,
  },
};

export const SelectedSystemTemplate: Story = {
  args: {
    templates: [...systemTemplates, ...userTemplates],
    selectedId: "s1",
  },
};

export const SystemTemplatesOnly: Story = {
  args: {
    templates: systemTemplates,
    selectedId: null,
  },
};
