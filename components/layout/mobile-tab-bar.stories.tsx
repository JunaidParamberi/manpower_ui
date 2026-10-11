import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MobileTabBar } from "./mobile-tab-bar";

const meta: Meta<typeof MobileTabBar> = {
  title: "Layout/MobileTabBar",
  component: MobileTabBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    onOpenMore: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof MobileTabBar>;

export const Default: Story = {
  render: (args) => (
    <div style={{ height: "100vh", position: "relative", background: "var(--bg-canvas)" }}>
      <MobileTabBar {...args} />
    </div>
  ),
};
