import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Plus } from "lucide-react";

import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof PageHeader> = {
  title: "Shared/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The one page title for every app-shell screen. Before this was adopted the app carried 13 different h1 treatments and two pages resized their own title when a fetch failed, because the error branch hand-rolled a heading while the success branch used this component. Use it for any page inside the app shell, including error and empty branches. Do not use it for auth, onboarding or client-facing document pages — those are deliberately larger and have their own specs in `components/shared/title-classes.ts`. Where a header is too bespoke to fit (the client detail header carries an avatar and status chips), import `PAGE_TITLE_CLASS` rather than retyping the spec.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: "Documents",
    description: "Manage your invoices, quotes, and proposals.",
  },
};

export const WithEyebrow: Story = {
  args: {
    eyebrow: "Acme Design Co.",
    title: "Brand Refresh 2026",
    description: "Active project with 3 milestones remaining.",
  },
};

export const WithActions: Story = {
  args: {
    title: "Clients",
    description: "Manage your client relationships.",
    actions: (
      <Button>
        <Plus size={16} />
        Add Client
      </Button>
    ),
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Dashboard",
  },
};

export const WithBackLink: Story = {
  name: "With back link",
  args: {
    backHref: "/clients",
    backLabel: "Clients",
    title: "New client",
    description: "Add someone you bill or work with. You can edit everything later.",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Every `/new` and `/edit` page hand-rolled this link above its heading, in two different styles — a ghost button on some pages, a small chevron on others. `backHref` makes it one control.",
      },
    },
  },
};

export const BackLinkWithActions: Story = {
  name: "Back link and actions",
  args: {
    backHref: "/projects",
    backLabel: "Back to project",
    title: "Edit project",
    description: "Update title, client link, status, and dates.",
    actions: (
      <Button variant="secondary">
        <Plus size={16} />
        Add milestone
      </Button>
    ),
  },
};

export const LongTitle: Story = {
  name: "Long title with actions",
  args: {
    title: "Bright Apps Landing Page — phase two discovery and build",
    description:
      "Titles come from user data, so they wrap. The actions stay on their own row on small screens and pull right from the sm breakpoint up.",
    actions: (
      <Button>
        <Plus size={16} />
        New invoice
      </Button>
    ),
  },
};
