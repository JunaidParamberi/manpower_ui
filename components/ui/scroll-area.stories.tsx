import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Separator } from "./separator";

const meta: Meta<typeof ScrollArea> = {
  title: "Base/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const tags = [
  "Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro", "WordPress",
  "Express.js", "Nest.js", "Fastify", "Hapi.js", "FeathersJS", "AdonisJS",
];

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-48 w-48 rounded-md border p-3">
      <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
      {tags.map((tag) => (
        <div key={tag}>
          <p className="text-sm">{tag}</p>
          <Separator className="my-2" />
        </div>
      ))}
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-64 whitespace-nowrap rounded-md border">
      <div className="flex p-4 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-24 w-24 shrink-0 rounded-md border bg-muted flex items-center justify-center text-sm text-muted-foreground"
          >
            Item {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const LongContent: Story = {
  render: () => (
    <ScrollArea className="h-64 w-80 rounded-md border p-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <p key={i} className="text-sm py-1 border-b last:border-0">
          Line item #{i + 1} — Service description goes here
        </p>
      ))}
    </ScrollArea>
  ),
};
