import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WorkCard } from "./work-card";
import type { WorkFacts } from "@/lib/dashboard/snapshot-types";

/**
 * The "Work" rail card: active projects with burn bars, or documents-in-flight
 * when there are no projects — the slot follows the data, never the plan tier.
 *
 * Use it to see where the freelancer's hours actually are. Don't use it for
 * overdue money (the queue) or detail (the project page).
 */
const meta: Meta<typeof WorkCard> = {
  title: "Features/Dashboard/WorkCard",
  component: WorkCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof WorkCard>;

const projects: WorkFacts = {
  kind: "projects",
  totalCount: 4,
  projects: [
    {
      id: "p1",
      title: "Brand refresh",
      clientName: "Acme Design Co.",
      deadlineIso: "2026-09-22",
      daysLabel: "9 days left",
      risk: "at_risk",
      budget: 24000,
      spent: 19600,
      progress: 0.82,
    },
    {
      id: "p2",
      title: "Website redesign",
      clientName: "Zenith Studio",
      deadlineIso: "2026-10-05",
      daysLabel: "3 weeks",
      risk: "watch",
      budget: 18000,
      spent: 7800,
      progress: 0.43,
    },
    {
      id: "p3",
      title: "Invoice template pack",
      clientName: "Maple Co.",
      deadlineIso: null,
      daysLabel: "No deadline",
      risk: "on_track",
      budget: null,
      spent: 1200,
      progress: null,
    },
  ],
};

const documents: WorkFacts = {
  kind: "documents",
  totalCount: 3,
  documents: [
    { id: "d1", title: "Website redesign proposal", clientName: "Zenith Studio", stage: "awaiting_invoice", ageDays: 2, amount: 18000, currency: "AED" },
    { id: "d2", title: "Quarterly brand invoice", clientName: "Acme Design Co.", stage: "awaiting_reply", ageDays: 9, amount: 9975, currency: "AED" },
    { id: "d3", title: "Logo exploration draft", clientName: "Maple Co.", stage: "draft", ageDays: 11, amount: 5000, currency: "AED" },
  ],
};

export const Projects: Story = {
  args: { work: projects, currency: "AED" },
};

export const DocumentsInFlight: Story = {
  args: { work: documents, currency: "AED" },
};

export const Empty: Story = {
  args: { work: { kind: "documents", documents: [], totalCount: 0 }, currency: "AED" },
};