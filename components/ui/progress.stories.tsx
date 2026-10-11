import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Progress, ProgressLabel, ProgressValue } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "Base/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: { value: 60 },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };
export const Half: Story = { args: { value: 50 } };
export const Full: Story = { args: { value: 100 } };

export const WithLabel: Story = {
  render: () => (
    <Progress value={72}>
      <ProgressLabel>Project completion</ProgressLabel>
      <ProgressValue>{(_formatted, value) => `${value ?? 0}%`}</ProgressValue>
    </Progress>
  ),
};

export const AllValues: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Progress value={10} />
      <Progress value={30} />
      <Progress value={60} />
      <Progress value={80} />
      <Progress value={100} />
    </div>
  ),
};
