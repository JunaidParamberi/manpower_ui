import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClientDetailTabs } from "./client-detail-tabs";

/** Overview / Projects / Documents / Activity / About for one client. Links that set ?tab=, so tabs are shareable and work before JS loads. Use only under the client money strip. */
const meta: Meta<typeof ClientDetailTabs> = {
  title: "Features/Clients/ClientDetailTabs",
  component: ClientDetailTabs,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [(Story) => <div className="max-w-[720px] bg-[var(--panel)] pt-4"><Story /></div>],
  args: { counts: { projects: 3, documents: 7 } },
};
export default meta;
type Story = StoryObj<typeof ClientDetailTabs>;

export const Overview: Story = { args: { tab: "overview" } };
export const DocumentsSelected: Story = { args: { tab: "documents" } };
export const Narrow: Story = {
  args: { tab: "about" },
  decorators: [(Story) => <div className="max-w-[340px] bg-[var(--panel)] pt-4"><Story /></div>],
};
