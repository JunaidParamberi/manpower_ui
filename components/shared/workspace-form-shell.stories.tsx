import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  WorkspaceFormAside,
  WorkspaceFormMain,
  WorkspaceFormSection,
  WorkspaceFormShell,
  WorkspaceInsightCard,
} from "./workspace-form-shell";

const meta: Meta = {
  title: "Shared/WorkspaceFormShell",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A full-width form workspace for create/edit screens that need readable sections plus a sticky context panel. Use it for dense operational forms, not for short one-card forms.",
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
};

export default meta;
type Story = StoryObj;

export const WorkspaceCanvas: Story = {
  render: () => (
    <WorkspaceFormShell>
      <WorkspaceFormMain>
        <WorkspaceFormSection
          title="Identity"
          description="Capture the details that make this record recognizable across the workspace."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="workspace-name">
                Display name
              </label>
              <Input id="workspace-name" defaultValue="Atlas Creative" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="workspace-email">
                Email
              </label>
              <Input id="workspace-email" defaultValue="hello@atlascreative.co.uk" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="workspace-phone">
                Phone
              </label>
              <Input id="workspace-phone" defaultValue="+44 20 7946 0854" />
            </div>
          </div>
        </WorkspaceFormSection>

        <WorkspaceFormSection
          title="Billing defaults"
          description="Keep document and portal details close to the record they affect."
          footer={
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save changes</Button>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input defaultValue="billing@atlascreative.co.uk" />
            <Input defaultValue="30 days" />
          </div>
        </WorkspaceFormSection>
      </WorkspaceFormMain>

      <WorkspaceFormAside>
        <WorkspaceInsightCard
          title="Live summary"
          description="Preview the saved profile before committing changes."
          action={<Badge variant="accent">Draft</Badge>}
        >
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <p className="font-medium">Atlas Creative</p>
              <p className="text-muted-foreground">Active client</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-muted-foreground">
              Billing email and payment terms are ready for invoices.
            </div>
          </div>
        </WorkspaceInsightCard>

        <WorkspaceInsightCard title="Guidance">
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>Add a billing email if invoices go to finance.</li>
            <li>Use notes only for internal relationship context.</li>
          </ul>
        </WorkspaceInsightCard>
      </WorkspaceFormAside>
    </WorkspaceFormShell>
  ),
};
