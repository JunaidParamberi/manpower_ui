import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "./card";

const meta: Meta<typeof Card> = {
  title: "Base/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here. You can put any content inside.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Cancel</Button>
        <Button className="ms-auto">Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const Small: Story = {
  render: () => (
    <Card size="sm" className="w-72">
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
        <CardDescription>Compact layout with less padding.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Content with tighter spacing.</p>
      </CardContent>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Invoice Overview</CardTitle>
        <CardDescription>This month&apos;s summary</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">View all</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">$12,400</p>
        <p className="text-sm text-muted-foreground">+8% from last month</p>
      </CardContent>
    </Card>
  ),
};

export const KpiCard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
      {[
        { label: "Total Revenue", value: "$24,500", delta: "+12%" },
        { label: "Outstanding", value: "$3,200", delta: "2 invoices" },
        { label: "Overdue", value: "$800", delta: "1 invoice" },
        { label: "Avg Pay Days", value: "14d", delta: "-3 days" },
      ].map((kpi) => (
        <Card key={kpi.label} size="sm">
          <CardHeader>
            <CardTitle>{kpi.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.delta}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
