import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  List,
  LayoutGrid,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta: Meta<typeof ToggleGroup> = {
  title: "Base/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {
  render: () => (
    <ToggleGroup defaultValue={["center"]}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight />
      </ToggleGroupItem>
      <ToggleGroupItem value="justify" aria-label="Justify">
        <AlignJustify />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup defaultValue={[]}>
      <ToggleGroupItem value="bold" aria-label="Bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Outline: Story = {
  render: () => (
    <ToggleGroup variant="outline" defaultValue={["list"]}>
      <ToggleGroupItem value="list" aria-label="List view">
        <List />
        <span>List</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid />
        <span>Grid</span>
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const OutlineNoGap: Story = {
  render: () => (
    <ToggleGroup variant="outline" spacing={0} defaultValue={["center"]}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ToggleGroup orientation="vertical" variant="outline" defaultValue={["list"]}>
      <ToggleGroupItem value="list" aria-label="List view">
        <List />
        <span>List view</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid />
        <span>Grid view</span>
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};
