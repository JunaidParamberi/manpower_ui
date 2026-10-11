import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { userEvent, within } from "storybook/test";

import { mockAIStreamFetch } from "../../../.storybook/mocks/ai-stream-fetch";
import type { ContentPostRow } from "@/lib/marketing/content-post-queries";

import { ContentPostDialog } from "./content-post-dialog";

const mockClients = [
  { id: "c1a2b3c4-d5e6-7890-abcd-ef1234567890", name: "Acme Design Co." },
  { id: "c2a2b3c4-d5e6-7890-abcd-ef1234567890", name: "Zenith Studio" },
];

const mockPost: ContentPostRow = {
  id: "post-1a2b3c4-d5e6-7890-abcd-ef1234567890",
  title: "Product launch teaser",
  platform: "Instagram",
  caption:
    "Something big is coming. Stay tuned — we're launching a feature you've been asking for. 👀",
  hashtags: ["productlaunch", "comingsoon", "buildinpublic"],
  media: [],
  status: "scheduled",
  scheduledAt: "2026-08-01T09:00:00.000Z",
  clientId: mockClients[0].id,
  clientName: mockClients[0].name,
  campaignId: null,
};

const meta: Meta<typeof ContentPostDialog> = {
  title: "Features/Marketing/ContentPostDialog",
  component: ContentPostDialog,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Create or edit a single content-calendar post: title, platform, status, client, schedule, caption, hashtags, and media. Includes an inline 'Draft with AI' prompt that streams a caption (and, on completion, hashtags) from the content-marketer agent. A centered dialog rather than the side sheet it replaces — the caption is both the field the AI streams into and the field users spend the most time in, and a 384px sheet gave it about half the width it needs; the body is two columns above `md` (caption plus AI drafting on the left, media plus hashtags on the right) and one column below. Use it from any surface that creates or edits a post — the calendar opens it from a day's add button and from a post chip. Don't use it for campaign generation; that's `CampaignDialog`, which drafts many posts at once. Mutations call the real `content-post-actions` server actions, so outside a connected app shell (e.g. this Storybook build) submitting fails gracefully with a toast; only the AI-stream fetch is mocked here.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContentPostDialog>;

export const Create: Story = {
  name: "Create (empty)",
  args: {
    open: true,
    onOpenChange: () => {},
    clients: mockClients,
  },
};

export const CreateOnDate: Story = {
  name: "Create (from a calendar day)",
  args: {
    open: true,
    onOpenChange: () => {},
    clients: mockClients,
    defaultDate: "2026-08-05",
  },
};

export const Edit: Story = {
  name: "Edit (populated)",
  args: {
    open: true,
    onOpenChange: () => {},
    clients: mockClients,
    post: mockPost,
  },
};

export const NoClients: Story = {
  name: "Create — no clients yet",
  args: {
    open: true,
    onOpenChange: () => {},
    clients: [],
  },
};

export const AIDrafting: Story = {
  name: "AI drafting (thinking)",
  args: {
    open: true,
    onOpenChange: () => {},
    clients: mockClients,
  },
  decorators: [
    (Story) => {
      useEffect(
        () =>
          mockAIStreamFetch({
            tokens: ["Something big is coming — get ready for the launch. 🚀"],
            delayMs: 5000,
          }),
        [],
      );
      return <Story />;
    },
  ],
  play: async () => {
    const canvas = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "Draft with AI" }));
    await userEvent.type(
      canvas.getByLabelText("Topic"),
      "New feature launch announcement",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Generate" }));
  },
};
