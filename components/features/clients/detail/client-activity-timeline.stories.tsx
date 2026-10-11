import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClientActivityTimeline } from "./client-activity-timeline";

/** Dated rows of recent client, project and document changes. The Activity tab of the client detail; not a global activity feed. */
const meta: Meta<typeof ClientActivityTimeline> = {
  title: "Features/Clients/ClientActivityTimeline",
  component: ClientActivityTimeline,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="max-w-[640px] bg-[var(--panel)] pb-4"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ClientActivityTimeline>;

export const Loaded: Story = {
  args: {
    items: [
      {
        id: "document-1",
        kind: "document",
        title: "Invoice INV-001",
        description: "Invoice sent",
        occurredAt: "2026-06-01T10:00:00.000Z",
        href: "/documents/doc-1",
      },
      {
        id: "project-1",
        kind: "project",
        title: "Website redesign",
        description: "Project active",
        occurredAt: "2026-05-30T10:00:00.000Z",
        href: "/projects/project-1",
      },
      {
        id: "client-created",
        kind: "client",
        title: "Client added",
        description: "Acme Design Co.",
        occurredAt: "2026-05-01T10:00:00.000Z",
        href: null,
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
