import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { FirstClientOnboardingForm } from "./first-client-onboarding-form";

const meta: Meta<typeof FirstClientOnboardingForm> = {
  title: "Onboarding/FirstClientOnboardingForm",
  component: FirstClientOnboardingForm,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-[680px] max-w-[calc(100vw-2rem)] rounded-[2rem] border bg-background p-8 shadow-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FirstClientOnboardingForm>;

export const Default: Story = {};

export const OrganizationClient: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("An organization"));
    await userEvent.type(canvas.getByLabelText(/Client display name/), "Acme Design Co.");
    await userEvent.type(canvas.getByLabelText("Email"), "hello@acmedesign.co");
    await userEvent.type(canvas.getByLabelText("Primary contact"), "Jane Doe");
    await userEvent.type(canvas.getByLabelText("Company"), "Acme Design Co.");
    await userEvent.click(canvas.getByLabelText("Currency"));
    await userEvent.click(within(document.body).getByText("AED - UAE dirham"));
  },
};

export const PersonClient: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("An individual"));
    await userEvent.type(canvas.getByLabelText(/Client name/), "Maya Chen");
    await userEvent.type(canvas.getByLabelText("Email"), "maya@example.com");
    await userEvent.type(canvas.getByLabelText("Phone"), "+971 50 123 4567");
  },
};
