import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import * as Skeletons from "./skeletons";

const meta: Meta = {
  title: "Features/Projects/Skeletons",
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

const portfolioFrame = (node: React.ReactNode) => <div className="h-[760px] bg-[var(--panel)]">{node}</div>;

/** /projects loading in List view — same blocks as the loaded page. */
export const PortfolioList: StoryObj = { render: () => portfolioFrame(<Skeletons.ProjectsPortfolioSkeleton view="list" />) };
/** /projects loading in Board view. */
export const PortfolioBoard: StoryObj = { render: () => portfolioFrame(<Skeletons.ProjectsPortfolioSkeleton view="board" />) };
/** /projects loading in Timeline view. */
export const PortfolioTimeline: StoryObj = { render: () => portfolioFrame(<Skeletons.ProjectsPortfolioSkeleton view="timeline" />) };
/** Switching projects in the List view. */
export const FocusWorkspace: StoryObj = { render: () => <div className="max-w-[900px] p-6"><Skeletons.ProjectFocusSkeleton /></div> };
