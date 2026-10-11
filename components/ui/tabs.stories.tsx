import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

const meta: Meta<typeof Tabs> = {
  title: "Base/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-muted-foreground pt-2">Project overview content.</p>
      </TabsContent>
      <TabsContent value="documents">
        <p className="text-sm text-muted-foreground pt-2">Documents list here.</p>
      </TabsContent>
      <TabsContent value="tasks">
        <p className="text-sm text-muted-foreground pt-2">Tasks kanban / list here.</p>
      </TabsContent>
    </Tabs>
  ),
};

export const LineVariant: Story = {
  render: () => (
    <Tabs defaultValue="invoices">
      <TabsList variant="line">
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="quotes">Quotes</TabsTrigger>
        <TabsTrigger value="proposals">Proposals</TabsTrigger>
        <TabsTrigger value="receipts">Receipts</TabsTrigger>
      </TabsList>
      <TabsContent value="invoices">
        <p className="text-sm text-muted-foreground pt-2">Invoice list content</p>
      </TabsContent>
      <TabsContent value="quotes">
        <p className="text-sm text-muted-foreground pt-2">Quote list content</p>
      </TabsContent>
      <TabsContent value="proposals">
        <p className="text-sm text-muted-foreground pt-2">Proposal list content</p>
      </TabsContent>
      <TabsContent value="receipts">
        <p className="text-sm text-muted-foreground pt-2">Receipt list content</p>
      </TabsContent>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="general" orientation="vertical" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="brand">Brand Kit</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">General settings.</p></CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="brand">
        <Card>
          <CardHeader><CardTitle>Brand Kit</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Brand colours, logo, and fonts.</p></CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="billing">
        <Card>
          <CardHeader><CardTitle>Billing</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Subscription and plan details.</p></CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="notifications">
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Email and push preferences.</p></CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="archived" disabled>Archived</TabsTrigger>
        <TabsTrigger value="deleted" disabled>Deleted</TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <p className="text-sm text-muted-foreground pt-2">Active items list</p>
      </TabsContent>
    </Tabs>
  ),
};
