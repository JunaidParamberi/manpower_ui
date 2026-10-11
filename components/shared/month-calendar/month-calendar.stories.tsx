import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MonthCalendar } from "./month-calendar";

type SampleEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
};

const SAMPLE_EVENTS: SampleEvent[] = [
  { id: "1", title: "Instagram carousel — Q3 launch", date: "2026-07-03" },
  { id: "2", title: "Blog post — pricing changes", date: "2026-07-03" },
  { id: "3", title: "LinkedIn — case study teaser", date: "2026-07-09" },
  { id: "4", title: "Newsletter — July roundup", date: "2026-07-15" },
  { id: "5", title: "TikTok — behind the scenes", date: "2026-07-15" },
  { id: "6", title: "X — feature announcement", date: "2026-07-15" },
  { id: "7", title: "Threads — poll", date: "2026-07-15" },
  { id: "8", title: "YouTube — short", date: "2026-07-15" },
  { id: "9", title: "Instagram story — client spotlight", date: "2026-07-28" },
];

function SampleEventPill({ event }: { event: SampleEvent }) {
  return (
    <div className="truncate rounded-sm bg-[var(--accent-soft)] px-1.5 py-0.5 text-[11px] leading-tight text-foreground">
      {event.title}
    </div>
  );
}

const meta: Meta<typeof MonthCalendar<SampleEvent>> = {
  title: "Shared/MonthCalendar",
  component: MonthCalendar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A generic, presentation-only month-grid-of-events component with zero domain knowledge. It renders a 6×7 Monday-first grid via `buildMonthGrid` and delegates every day to `DayCell`, bucketing any array of events with a caller-supplied `eventDate` accessor and `renderEvent` renderer. Use it for any month-grid-of-events UI — the Marketing content calendar today, and the deferred Timeline view later. It owns no period state and renders no month navigation: the host page keeps the period in the URL and renders its own nav, so the calendar never competes with the page header for a row. It is NOT a date picker — for single-date selection inside a form use `FormDatePicker`.",
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
type Story = StoryObj<typeof MonthCalendar<SampleEvent>>;

const BASE_ARGS = {
  year: 2026,
  month0: 6, // July 2026
  events: SAMPLE_EVENTS,
  eventId: (e: SampleEvent) => e.id,
  eventDate: (e: SampleEvent) => e.date,
  renderEvent: (e: SampleEvent) => <SampleEventPill event={e} />,
};

export const Default: Story = {
  args: BASE_ARGS,
};

/** July 15 holds five posts against a cap of three, so it collapses the rest. */
export const WithOverflow: Story = {
  args: { ...BASE_ARGS, maxEventsPerDay: 3 },
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
