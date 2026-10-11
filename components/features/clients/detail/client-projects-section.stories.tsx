import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ProjectListRow } from "@/types";
import { ClientProjectsSection } from "./client-projects-section";

function project(o: Partial<ProjectListRow>): ProjectListRow {
  return {
    id: "p1",
    user_id: "u1",
    client_id: "c1",
    title: "Villa Jumeirah fit-out",
    status: "active",
    budget: null,
    spent: null,
    hourly_rate: null,
    start_date: null,
    deadline: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
    client: { id: "c1", name: "Al Noor Interiors" },
    ...o,
  };
}

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

/** A client's projects as flush rows: name, status mark and deadline countdown. Used on the client Overview (open only, with View all) and the Projects tab. Not the projects page list. */
const meta: Meta<typeof ClientProjectsSection> = {
  title: "Features/Clients/ClientProjectsSection",
  component: ClientProjectsSection,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [(Story) => <div className="max-w-[640px] bg-[var(--panel)] pb-4"><Story /></div>],
  args: { clientId: "c1" },
};
export default meta;
type Story = StoryObj<typeof ClientProjectsSection>;

const open = [
  project({ id: "a", title: "Showroom brand refresh", deadline: inDays(-3) }),
  project({ id: "b", title: "Villa Jumeirah fit-out", deadline: inDays(5) }),
  project({ id: "c", title: "Majlis lighting plan", status: "planning" }),
  project({ id: "d", title: "Catalogue reprint", status: "on_hold", deadline: inDays(30) }),
];

export const AllProjects: Story = { args: { projects: [...open, project({ id: "e", title: "Catalogue photography", status: "completed" })] } };
export const OverviewOpenOnly: Story = { args: { title: "Open projects", projects: open.slice(0, 3), count: 4, viewAllHref: "/clients/c1?tab=projects" } };
export const Empty: Story = { args: { projects: [] } };
