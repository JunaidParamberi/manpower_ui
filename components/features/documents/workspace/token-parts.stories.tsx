import type { Meta } from "@storybook/nextjs-vite";
import { Code, Dot, Tile } from "./token-parts";

/**
 * The small marks used in the document rail: a client monogram, a project colour square and a mono code badge.
 * Use to show who or what a value refers to at a glance. Not for status: use the status pill.
 */
const meta: Meta = { title: "Features/Documents/Workspace/TokenParts", tags: ["autodocs"] };
export default meta;

export const Marks = {
  render: () => (
    <div className="flex items-center gap-3 text-[13px]">
      <Tile id="c1" label="Acme Studio" />
      <Tile id="c2" label="Northwind Labs" />
      <Dot id="p1" />
      <Dot id="p2" />
      <Code>AED</Code>
      <Code>GBP</Code>
    </div>
  ),
};
