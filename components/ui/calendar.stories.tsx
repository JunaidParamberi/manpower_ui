"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { Calendar } from "./calendar";

const meta: Meta<typeof Calendar> = {
  title: "Base/Calendar",
  component: Calendar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

function DefaultCalendar() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return <Calendar mode="single" selected={date} onSelect={setDate} />;
}

function RangeCalendar() {
  const [range, setRange] = React.useState<
    import("react-day-picker").DateRange | undefined
  >({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return <Calendar mode="range" selected={range} onSelect={setRange} />;
}

function DropdownCaptionCalendar() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      captionLayout="dropdown"
    />
  );
}

function WithoutOutsideDaysCalendar() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      showOutsideDays={false}
    />
  );
}

export const Default: Story = {
  render: () => <DefaultCalendar />,
};

export const WithRange: Story = {
  render: () => <RangeCalendar />,
};

export const DropdownCaption: Story = {
  render: () => <DropdownCaptionCalendar />,
};

export const WithoutOutsideDays: Story = {
  render: () => <WithoutOutsideDaysCalendar />,
};
