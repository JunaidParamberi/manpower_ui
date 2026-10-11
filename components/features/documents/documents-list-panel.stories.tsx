import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { DocumentsListToggle } from "./documents-list-panel";

const meta: Meta<typeof DocumentsListToggle> = {
  title: "Documents/DocumentsListToggle",
  component: DocumentsListToggle,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Hides or shows the documents list pane on desktop so the open document gets the full width — " +
          "the same idea as the app sidebar. Shown in the list header when open and in a slim rail when " +
          "collapsed. Also toggled with the `[` key (ignored while typing; ⌘[ stays browser Back). The " +
          "state is saved in the `documents_list_state` cookie and read by the documents layout, so the " +
          "page loads in the last state without a flash. Hidden below the `lg` breakpoint, where list and " +
          "document are separate screens.",
      },
    },
  },
  args: { onToggle: () => {} },
};

export default meta;
type Story = StoryObj<typeof DocumentsListToggle>;

export const ListOpen: Story = { name: "List open (hide)", args: { collapsed: false } };

export const ListCollapsed: Story = { name: "List collapsed (show)", args: { collapsed: true } };

function RailDemo() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-64 w-[640px] overflow-hidden rounded-lg border border-border bg-background">
      <aside
        className={
          "shrink-0 border-r border-border transition-[width] duration-200 motion-reduce:transition-none " +
          (collapsed ? "w-12" : "w-64")
        }
      >
        {collapsed ? (
          <div className="flex justify-center pt-3">
            <DocumentsListToggle collapsed onToggle={() => setCollapsed(false)} />
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Quote</p>
              <p className="text-xs text-muted-foreground">3 documents</p>
            </div>
            <DocumentsListToggle collapsed={false} onToggle={() => setCollapsed(true)} />
          </div>
        )}
      </aside>
      <main className="flex-1 p-6 text-sm text-muted-foreground">QUO-0004 — the document gets the freed width.</main>
    </div>
  );
}

export const InLayout: Story = {
  name: "In the master-detail layout",
  render: () => <RailDemo />,
};
