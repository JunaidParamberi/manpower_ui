import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta: Meta<typeof Sheet> = {
  title: "Base/Sheet",
  component: Sheet,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button>Open right sheet</Button>} />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit client</SheetTitle>
          <SheetDescription>
            Update the client details. Click save when done.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sheet-name">Name</Label>
            <Input id="sheet-name" defaultValue="Acme Corp" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sheet-email">Email</Label>
            <Input id="sheet-email" defaultValue="contact@acme.com" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose render={<Button variant="outline">Cancel</Button>} />
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open left sheet</Button>} />
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4">
          {["Dashboard", "Clients", "Projects", "Documents", "Finance", "Settings"].map((item) => (
            <p key={item} className="text-sm px-2 py-1.5 hover:bg-muted rounded cursor-pointer">
              {item}
            </p>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open bottom sheet</Button>} />
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Quick add task</SheetTitle>
          <SheetDescription>Add a task to your current project.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <Input placeholder="Task title" />
        </div>
        <SheetFooter>
          <Button>Add task</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Top: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open top sheet</Button>} />
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>System notification</SheetTitle>
          <SheetDescription>A new update is available for Manpower.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button variant="outline">Dismiss</Button>} />
          <Button>Update now</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};
