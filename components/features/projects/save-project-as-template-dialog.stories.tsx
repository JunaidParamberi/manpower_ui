import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { SaveProjectAsTemplateDialog } from "./save-project-as-template-dialog";
import { Button } from "@/components/ui/button";

function SaveTemplateDialogDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Save as template
      </Button>
      <SaveProjectAsTemplateDialog
        projectId="project-1"
        defaultName="Website redesign"
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

const meta: Meta<typeof SaveProjectAsTemplateDialog> = {
  title: "Features/Projects/SaveProjectAsTemplateDialog",
  component: SaveProjectAsTemplateDialog,
  parameters: {
    docs: {
      description: {
        component:
          "Dialog to copy a project's milestones and top-level tasks into a reusable template. Used from the project actions menu and projects table.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SaveProjectAsTemplateDialog>;

export const Default: Story = {
  render: () => <SaveTemplateDialogDemo />,
};
