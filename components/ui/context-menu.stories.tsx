import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Copy, Edit, Share, Star, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";

const meta: Meta<typeof ContextMenu> = {
  title: "Base/ContextMenu",
  component: ContextMenu,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem>
            <Edit />
            Edit
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Copy />
            Duplicate
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Star />
            Favourite
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Share />
              Share
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Send via email</ContextMenuItem>
              <ContextMenuItem>Copy link</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <Trash2 />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithCheckboxItems: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Right-click for options
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>View Options</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>Show toolbar</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>Show sidebar</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked>Show status bar</ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuLabel>Sort By</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value="name">
          <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
          <ContextMenuRadioItem value="date">Date modified</ContextMenuRadioItem>
          <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
