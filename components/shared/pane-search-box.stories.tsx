import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaneSearchBox } from "./pane-search-box";

/** Search field at the top of a list pane (Projects, Clients). Press "/" to focus, Esc to clear. Not for global search: that is the ⌘K palette. */
const meta: Meta<typeof PaneSearchBox> = {
  title: "Shared/PaneSearchBox",
  component: PaneSearchBox,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-[300px]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof PaneSearchBox>;

function Live({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return <PaneSearchBox value={value} onChange={setValue} placeholder="Find a client" ariaLabel="Find a client" />;
}
export const Empty: Story = { render: () => <Live initial="" /> };
export const WithQuery: Story = { render: () => <Live initial="Al Noor" /> };
