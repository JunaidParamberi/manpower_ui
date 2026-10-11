import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ClientLens } from "@/lib/clients/client-lens";
import { ClientLensChips } from "./client-lens-chips";

/** Client list filters with counts. Needs you turns red when any client needs attention. Use only in the clients list pane header. */
const meta: Meta<typeof ClientLensChips> = {
  title: "Features/Clients/ClientLensChips",
  component: ClientLensChips,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-[304px]"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ClientLensChips>;

function Live({ initial, needs }: { initial: ClientLens; needs: number }) {
  const [lens, setLens] = useState(initial);
  return <ClientLensChips lens={lens} onChange={setLens} counts={{ all: 8, "needs-you": needs, healthy: 5, quiet: 1 }} />;
}
export const Default: Story = { render: () => <Live initial="all" needs={2} /> };
export const NothingNeedsYou: Story = { render: () => <Live initial="all" needs={0} /> };
export const QuietSelected: Story = { render: () => <Live initial="quiet" needs={2} /> };
