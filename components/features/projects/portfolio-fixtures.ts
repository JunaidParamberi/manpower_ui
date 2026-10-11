// Storybook fixtures for the projects portfolio views. Not imported by app code.
import { withPace, type PacedProject } from "@/lib/projects/portfolio-filters";
import type { PortfolioProject } from "@/lib/projects/portfolio-summary";

export const FIXTURE_TODAY = "2026-10-08";

type Seed = Omit<Partial<PortfolioProject>, "client"> & { id: string; title: string; clientName: string };

function project({ clientName, ...over }: Seed): PortfolioProject {
  return {
    user_id: "u1",
    client_id: `c-${clientName}`,
    status: "active",
    budget: null,
    spent: 0,
    hourly_rate: null,
    start_date: "2026-09-01",
    deadline: "2026-12-31",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    client: { id: `c-${clientName}`, name: clientName },
    taskDone: 0,
    taskTotal: 0,
    spend: 0,
    nextTask: null,
    milestones: [],
    ...over,
  };
}

export const PORTFOLIO_FIXTURE: PortfolioProject[] = [
  project({ id: "p1", title: "Cedar Pitch Deck", clientName: "Cedar Media LLC", start_date: "2026-05-10", deadline: "2026-06-23", budget: 3500, spend: 500, taskDone: 1, taskTotal: 7, nextTask: { id: "t1", title: "Final logo concepts, round 1", dueDate: "2026-06-23" }, milestones: [{ id: "m1", title: "Moodboard", dueDate: "2026-06-01" }] }),
  project({ id: "p2", title: "Bright Apps Landing Page", clientName: "Bright Apps Ltd", start_date: "2026-07-01", deadline: "2026-08-08", budget: 9000, taskDone: 0, taskTotal: 5, nextTask: { id: "t2", title: "Project setup meeting", dueDate: null } }),
  project({ id: "p3", title: "Brand refresh", clientName: "Atlas Interiors", start_date: "2026-08-20", deadline: "2026-10-13", budget: 12000, spend: 10400, taskDone: 7, taskTotal: 13, nextTask: { id: "t3", title: "Brand guidelines PDF", dueDate: "2026-10-10" }, milestones: [{ id: "m3", title: "Logo sign-off", dueDate: "2026-09-20" }] }),
  project({ id: "p4", title: "Website build", clientName: "Lumen Labs", start_date: "2026-09-01", deadline: "2026-11-02", budget: 18000, spend: 6100, taskDone: 7, taskTotal: 20, nextTask: { id: "t4", title: "Homepage wireframe review", dueDate: "2026-10-12" }, milestones: [{ id: "m4", title: "Design freeze", dueDate: "2026-10-20" }] }),
  project({ id: "p5", title: "Social kit", clientName: "Harbor & Co", start_date: "2026-09-25", deadline: "2026-10-24", budget: 4000, spend: 2600, taskDone: 7, taskTotal: 10, nextTask: { id: "t5", title: "Story templates", dueDate: "2026-10-15" } }),
  project({ id: "p6", title: "Menu design", clientName: "Bayview Café", status: "on_hold", start_date: "2026-08-01", deadline: "2026-10-10", budget: 2500, spend: 2100, taskDone: 7, taskTotal: 8, nextTask: { id: "t6", title: "Waiting on final prices", dueDate: null } }),
  project({ id: "p7", title: "Annual report 2026", clientName: "Nova Retail FZ-LLC", status: "planning", start_date: "2026-10-20", deadline: "2026-12-15", budget: 15000, nextTask: { id: "t7", title: "Scope call with Nova", dueDate: "2026-10-14" }, milestones: [{ id: "m7", title: "Draft", dueDate: "2026-11-20" }] }),
  project({ id: "p8", title: "Photo shoot, spring line", clientName: "Al Noor Hospitality & Events Management Group LLC", status: "planning", start_date: "2026-11-15", deadline: "2027-01-20", budget: 8000, taskTotal: 2, nextTask: { id: "t8", title: "Location shortlist", dueDate: null } }),
  project({ id: "p9", title: "Logo animation", clientName: "Lumen Labs", status: "completed", start_date: "2026-07-15", deadline: "2026-09-18", budget: 3000, spend: 2850, taskDone: 6, taskTotal: 6 }),
  project({ id: "p10", title: "Retainer, ongoing tweaks", clientName: "Atlas Interiors", deadline: null, start_date: null, taskDone: 2, taskTotal: 5 }),
];

export const PACED_FIXTURE: PacedProject[] = withPace(PORTFOLIO_FIXTURE, FIXTURE_TODAY);
