import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ProjectTemplateSummaryRow } from "@/types";

import { ProjectTemplatesManager } from "./project-templates-manager";

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
    name: "Monthly retainer",
    description: "Recurring monthly client work.",
    created_at: "2026-05-15T10:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",
    milestone_count: 3,
    task_count: 6,
  },
];

const userTemplates: ProjectTemplateSummaryRow[] = [
  {
    id: "u1",
    user_id: "user-1",
    is_system: false,
    name: "Brand sprint",
    description: null,
    created_at: "2026-04-01T10:00:00Z",
    updated_at: "2026-04-01T10:00:00Z",
    milestone_count: 4,
    task_count: 8,
  },
];

const meta: Meta<typeof ProjectTemplatesManager> = {
  title: "Features/Projects/ProjectTemplatesManager",
  component: ProjectTemplatesManager,
  parameters: {
    docs: {
      description: {
        component:
          "Manage Manpower starter templates and your saved project templates from `/projects/templates`. User templates can be renamed or deleted; all templates can be used to start a new project.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProjectTemplatesManager>;

export const WithTemplates: Story = {
  args: { templates: [...systemTemplates, ...userTemplates] },
};

export const SystemOnly: Story = {
  args: { templates: systemTemplates },
};

export const EmptyUserTemplates: Story = {
  args: { templates: systemTemplates },
};

export const SingleUserTemplate: Story = {
  args: {
    templates: [...systemTemplates, userTemplates[0]!],
  },
};
