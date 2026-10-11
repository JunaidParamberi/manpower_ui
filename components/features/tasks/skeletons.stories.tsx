import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import * as Skeletons from "./skeletons";

const meta: Meta = {
  title: "Features/Tasks/Skeletons",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

const entries = Object.entries(Skeletons).filter(
  ([, value]) => typeof value === "function",
);

export const All: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-10">
      {entries.map(([name, Component]) => {
        const C = Component as React.ComponentType;
        return (
          <section key={name} className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {name}
            </h3>
            <div className="rounded border border-border p-4">
              <C />
            </div>
          </section>
        );
      })}
    </div>
  ),
};
