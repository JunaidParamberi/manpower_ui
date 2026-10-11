import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CompanionPanel } from "./companion-panel";

const meta: Meta<typeof CompanionPanel> = {
  title: "Auth/CompanionPanel",
  component: CompanionPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Step-aware companion panel beside auth forms (onboarding now uses OnboardingPageShell instead, without this panel). Use to motivate and preview what the user is building (invoice header, brand, client portal). Headline uses the shared ambient gradient + backdrop. Updates live from form values where a caller still wires onValuesChange.",
      },
    },
  },
  decorators: [(Story) => <div className="h-svh w-full">{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof CompanionPanel>;

export const Auth: Story = { args: { variant: "auth" } };
export const ProfileEmpty: Story = { args: { variant: "profile", values: {} } };
export const ProfileFilled: Story = {
  args: { variant: "profile", values: { fullName: "Jane Doe", companyName: "Atlas Studio", currency: "AED" } },
};
export const BrandFilled: Story = {
  args: { variant: "brand", values: { companyName: "Atlas Studio", primaryColor: "#4f46e5", secondaryColor: "#fde68a", font: "Playfair Display" } },
};
export const ClientFilled: Story = { args: { variant: "client", values: { companyName: "Atlas Studio" } } };
