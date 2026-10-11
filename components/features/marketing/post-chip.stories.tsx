import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PostChip, type PostChipPost } from "./post-chip";

const CAMPAIGN_A = "11111111-2222-3333-4444-555555555555";
const CAMPAIGN_B = "66666666-7777-8888-9999-aaaaaaaaaaaa";

function at(hour: number, minute = 0): string {
  return new Date(2026, 5, 15, hour, minute).toISOString();
}

const SCHEDULED: PostChipPost = {
  id: "post-1",
  title: "Launch teaser — 3 slides",
  platform: "Instagram",
  status: "scheduled",
  scheduledAt: at(9),
  campaignId: CAMPAIGN_A,
};

const meta: Meta<typeof PostChip> = {
  title: "Marketing/PostChip",
  component: PostChip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "One content post as it appears inside a calendar day cell, a week column, or the agenda list. Shows a campaign colour stripe, the platform icon, the scheduled time, the title, and a status dot. The stripe is derived from the campaign id (`campaignColorClass`), so campaign membership reads at a glance without a colour column in the database; posts with no campaign get a transparent stripe to keep text aligned. Use `compact` inside month cells and `detailed` in week columns and the agenda. This is the pure variant — use `DraggablePostChip` inside a `DndContext` when the chip must be draggable. Not for use outside a calendar/list context: for a standalone post summary use a card.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PostChip>;

export const Scheduled: Story = {
  args: { post: SCHEDULED, onClick: () => console.log("open post") },
};

export const Idea: Story = {
  args: {
    post: {
      id: "post-2",
      title: "Repurpose the pricing thread",
      platform: "X",
      status: "idea",
      scheduledAt: null,
      campaignId: null,
    },
    onClick: () => console.log("open post"),
  },
};

export const Drafted: Story = {
  args: {
    post: {
      id: "post-3",
      title: "Case study — Nomad Studio rebrand",
      platform: "LinkedIn",
      status: "drafted",
      scheduledAt: at(11),
      campaignId: CAMPAIGN_B,
    },
    onClick: () => console.log("open post"),
  },
};

export const Posted: Story = {
  args: {
    post: {
      id: "post-4",
      title: "Behind the scenes at the studio",
      platform: "TikTok",
      status: "posted",
      scheduledAt: at(18, 30),
      campaignId: CAMPAIGN_A,
    },
    onClick: () => console.log("open post"),
  },
};

/** An unknown platform name falls back to a globe icon rather than breaking. */
export const UnknownPlatform: Story = {
  args: {
    post: {
      id: "post-5",
      title: "Cross-post to the newsletter",
      platform: "Substack",
      status: "drafted",
      scheduledAt: at(7),
      campaignId: null,
    },
    onClick: () => console.log("open post"),
  },
};

export const Detailed: Story = {
  args: { post: SCHEDULED, variant: "detailed", onClick: () => console.log("open") },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

/** Read-only chip: no onClick, so it renders as a div and is not focusable. */
export const ReadOnly: Story = {
  args: { post: SCHEDULED },
};

/** How the chip looks under the cursor while being dragged. */
export const DragOverlay: Story = {
  args: { post: SCHEDULED, isDragOverlay: true },
};
