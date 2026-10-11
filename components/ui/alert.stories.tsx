import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AlertCircle, CheckCircle, Info, Terminal } from "lucide-react";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "./alert";
import { Button } from "./button";

const meta: Meta<typeof Alert> = {
  title: "Base/Alert",
  component: Alert,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert>
      <Terminal />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components and dependencies to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again to continue.
      </AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Alert>
      <Info />
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>
        A new version of the app is available. Refresh to get the latest features.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Refresh
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert>
      <CheckCircle className="text-[var(--success)]" />
      <AlertTitle>Payment recorded</AlertTitle>
      <AlertDescription>
        Invoice INV-0042 has been marked as paid. A payment voucher has been generated.
      </AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-full max-w-lg">
      <Alert>
        <Terminal />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>This is the default alert style.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Destructive</AlertTitle>
        <AlertDescription>This is the destructive alert style.</AlertDescription>
      </Alert>
    </div>
  ),
};
