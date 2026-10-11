import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SentStrip } from "./sent-strip";

/**
 * What has happened to a sent document: sent, viewed, paid. Use above the paper in the read view.
 * Not for drafts, which have no history yet.
 */
const meta: Meta<typeof SentStrip> = {
  title: "Features/Documents/Workspace/SentStrip",
  component: SentStrip,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof SentStrip>;

export const SentViewedPaid: Story = {
  args: { parts: ["Sent to sara@acme.studio on 2 Oct", "viewed 3 Oct", "AED 5,000 paid on 6 Oct"], onActivity: () => {} },
};
export const JustSent: Story = { args: { parts: ["Sent to sara@acme.studio today"] } };
