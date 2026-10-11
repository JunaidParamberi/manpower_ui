import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkspaceFrame } from "./workspace-frame";
import { WorkspaceHeader } from "./workspace-header";

/**
 * The layout of a document page: header, a sunken canvas for the paper, and a 300px settings rail
 * that becomes a bottom sheet on narrow screens. Use once per document page. Not for list pages.
 */
const meta: Meta<typeof WorkspaceFrame> = {
  title: "Features/Documents/Workspace/WorkspaceFrame",
  component: WorkspaceFrame,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof WorkspaceFrame>;

const Block = ({ label, h }: { label: string; h: string }) => (
  <div className={`grid w-full max-w-[800px] place-items-center rounded-md bg-white text-[12px] text-[#54585F] ${h}`}>{label}</div>
);

function Demo({ desktop }: { desktop: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-[560px]">
      <WorkspaceFrame
        desktop={desktop}
        railLabel="Document settings"
        railOpen={open}
        onRailOpenChange={setOpen}
        header={
          <WorkspaceHeader backHref="#" backLabel="Invoices" title="INV-0042" statusLabel="Draft" statusTone="neutral"
            actions={desktop ? null : <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Settings</Button>} />
        }
        paper={<Block label="Paper" h="h-[420px]" />}
        rail={<div className="p-4 text-[13px] text-[var(--fg-2)]">Rail content</div>}
      />
    </div>
  );
}
export const Desktop: Story = { render: () => <Demo desktop /> };
export const Mobile: Story = { render: () => <Demo desktop={false} /> };
