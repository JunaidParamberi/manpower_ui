import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PostChipPost } from "./post-chip";
import { UnscheduledRail } from "./unscheduled-rail";

const POSTS: PostChipPost[] = [
  {
    id: "1",
    title: "Repurpose the pricing thread",
    platform: "X",
    status: "idea",
    scheduledAt: null,
    campaignId: null,
  },
  {
    id: "2",
    title: "Client spotlight — Harbour & Co",
    platform: "Instagram",
    status: "idea",
    scheduledAt: null,
    campaignId: "11111111-2222-3333-4444-555555555555",
  },
  {
    id: "3",
    title: "Hot take: retainers beat hourly",
    platform: "LinkedIn",
    status: "drafted",
    scheduledAt: null,
    campaignId: null,
  },
  {
    id: "4",
    title: "Studio tour teaser",
    platform: "TikTok",
    status: "idea",
    scheduledAt: null,
    campaignId: null,
  },
];

const meta: Meta<typeof UnscheduledRail> = {
  title: "Marketing/UnscheduledRail",
  component: UnscheduledRail,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A horizontal rail of content posts that have no scheduled date. This exists because dateless posts are invisible in a calendar grid — the first version of /marketing fetched them and then silently dropped them during day-bucketing, so an idea saved without a date disappeared. The rail is also a drop target: dragging a post onto it clears the date and returns the post to the idea queue. It renders nothing when it is empty and not receiving a drag, so a fully-scheduled month pays no vertical space for it. Use it directly above a calendar; don't use it as a general post list — that's what the agenda view is for.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UnscheduledRail>;

export const Default: Story = {
  args: { posts: POSTS, onPostClick: (post) => console.log("open", post.id) },
};

export const SinglePost: Story = {
  args: {
    posts: [POSTS[0]],
    onPostClick: (post) => console.log("open", post.id),
  },
};

/** Empty and idle: renders nothing at all. */
export const Empty: Story = {
  args: { posts: [], onPostClick: () => {} },
};

/** Empty but receiving a drag: shows the drop affordance. */
export const EmptyDropTarget: Story = {
  args: { posts: [], onPostClick: () => {}, isOver: true },
};

export const DropTargetActive: Story = {
  args: { posts: POSTS, onPostClick: () => {}, isOver: true },
};
