import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WeekCalendar } from "./week-calendar";

type SampleEvent = {
  id: string;
  title: string;
  at: string; // ISO datetime
};

function at(day: number, hour: number, minute = 0): string {
  return new Date(2026, 5, day, hour, minute).toISOString();
}

const SAMPLE_EVENTS: SampleEvent[] = [
  { id: "1", title: "09:00 · IG — Launch teaser", at: at(15, 9) },
  { id: "2", title: "14:00 · TikTok — Studio tour", at: at(15, 14) },
  { id: "3", title: "11:00 · LinkedIn — Case study", at: at(17, 11) },
  { id: "4", title: "08:00 · X — Build thread", at: at(19, 8) },
  { id: "5", title: "18:30 · Threads — Poll", at: at(19, 18, 30) },
];

function SampleEventPill({ event }: { event: SampleEvent }) {
  return (
    <div className="truncate rounded-sm bg-[var(--accent-soft)] px-1.5 py-1 text-[11px] leading-tight text-foreground">
      {event.title}
    </div>
  );
}

const meta: Meta<typeof WeekCalendar<SampleEvent>> = {
  title: "Shared/MonthCalendar/WeekCalendar",
  component: WeekCalendar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Seven full-height day columns for one Monday-anchored week, built on the same `DayCell` primitive as `MonthCalendar`. Use it when a week needs room for detail the month grid cannot show — time of day, platform, full titles — such as the Marketing week view. It has no hour-of-day axis on purpose: content posts cluster at a few times per day, so a time grid would be mostly empty space. Don't use it as a scheduling grid for appointments or time-blocking; that needs a real time axis. Below the `sm` breakpoint the columns stack vertically and each cell labels its own weekday.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-5xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WeekCalendar<SampleEvent>>;

const BASE_ARGS = {
  weekAnchor: "2026-06-15",
  events: SAMPLE_EVENTS,
  eventId: (e: SampleEvent) => e.id,
  eventDate: (e: SampleEvent) => e.at,
  renderEvent: (e: SampleEvent) => <SampleEventPill event={e} />,
};

export const Default: Story = {
  args: BASE_ARGS,
};

export const WithAddButtons: Story = {
  args: {
    ...BASE_ARGS,
    onDayAdd: (iso: string) => console.log("add post on", iso),
  },
};

export const Loading: Story = {
  args: { ...BASE_ARGS, isLoading: true },
};

export const Empty: Story = {
  args: { ...BASE_ARGS, events: [] },
};
