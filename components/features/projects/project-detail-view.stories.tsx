import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { DigestInvoiceInput } from "@/lib/projects/digest-facts";
import type { ProfitabilityInvoice } from "@/lib/projects/project-profitability";
import type {
  DocumentListRow,
  ExpenseListRow,
  ProjectListRow,
  ProjectMilestoneRow,
  TaskRow,
  TimeEntryListRow,
} from "@/types";

import { AiPanelProvider } from "@/lib/ai-panel/context";
import { ProjectDetailView } from "./project-detail-view";

const project: ProjectListRow = {
  id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  user_id: "u1",
  client_id: "c1",
  title: "Brand Refresh 2026",
  description: null,
  status: "active",
  budget: 15000,
  spent: 4200,
  hourly_rate: null,
  start_date: "2026-04-01",
  deadline: "2026-06-30",
  created_at: "2026-04-01T09:00:00Z",
  updated_at: "2026-05-20T16:00:00Z",
  client: { id: "c1", name: "Acme Design Co." },
} as ProjectListRow;

const milestones: ProjectMilestoneRow[] = [
  {
    id: "m1",
    project_id: project.id,
    title: "Design approval",
    description: "Client signs off on the visual direction.",
    status: "in_progress",
    due_date: "2026-06-15",
    sort_order: 0,
    client_visible: true,
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
  },
  {
    id: "m2",
    project_id: project.id,
    title: "Launch handoff",
    description: null,
    status: "upcoming",
    due_date: "2026-06-30",
    sort_order: 1,
    client_visible: false,
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
  },
];

const tasks: TaskRow[] = [
  {
    id: "t1",
    project_id: project.id,
    title: "Homepage mockup",
    status: "done",
    due_date: "2026-06-10",
    priority: "high",
    labels: [],
    description: null,
    start_date: null,
    completed_at: "2026-06-08T12:00:00Z",
    estimated_minutes: 180,
    sort_order: 0,
    client_visible: true,
    parent_task_id: null,
    milestone_id: "m1",
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-08T12:00:00Z",
  },
  {
    id: "t2",
    project_id: project.id,
    title: "Design review call",
    status: "in_progress",
    due_date: "2026-06-15",
    priority: "medium",
    labels: [],
    description: null,
    start_date: null,
    completed_at: null,
    estimated_minutes: 60,
    sort_order: 1,
    client_visible: true,
    parent_task_id: null,
    milestone_id: "m1",
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
  },
];

const timeEntries: TimeEntryListRow[] = [];
const expenses: ExpenseListRow[] = [];
const documents: DocumentListRow[] = [];
const invoices: ProfitabilityInvoice[] = [];
const digestInvoices: DigestInvoiceInput[] = [];

const meta: Meta<typeof ProjectDetailView> = {
  // The summary card carries Kraft's help button, which reads the AI panel.
  decorators: [
    (Story) => (
      <AiPanelProvider>
        <Story />
      </AiPanelProvider>
    ),
  ],
  title: "Features/Projects/ProjectDetailView",
  component: ProjectDetailView,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Focused single-project page rendered at `/projects/[id]`. Shows a project's summary, health signals, and tabs (Tasks/Timeline/Documents/Time/Expenses). Use this when a user opens one project directly (from Open page on the projects page, the dashboard, tasks, or a client's linked projects). Do not use for the portfolio — that's `ProjectsPage` (List / Board / Timeline).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectDetailView>;

export const Default: Story = {
  args: {
    project,
    tasks,
    milestones,
    timeEntries,
    expenses,
    documents,
    invoices,
    digestInvoices,
    defaultCurrency: "AED",
    userDisplayName: "John Doe",
    initialTimelineView: "milestones",
  },
};

export const EmptyProject: Story = {
  args: {
    project: { ...project, title: "New Client Onboarding", status: "planning" },
    tasks: [],
    milestones: [],
    timeEntries: [],
    expenses: [],
    documents: [],
    invoices: [],
    digestInvoices: [],
    defaultCurrency: "AED",
    userDisplayName: "John Doe",
    initialTimelineView: "milestones",
  },
};
