import { computePace, type Pace } from "@/lib/projects/project-pace";
import type { PortfolioProject } from "@/lib/projects/portfolio-summary";
import type { ProjectStatus } from "@/types";

export type PortfolioLens = "all" | "needs_you" | "active" | "planning" | "done";
export const PORTFOLIO_LENSES: { id: PortfolioLens; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs_you", label: "Needs you" },
  { id: "active", label: "Active" },
  { id: "planning", label: "Planning" },
  { id: "done", label: "Done" },
];

export type PacedProject = PortfolioProject & { pace: Pace };

export function withPace(projects: PortfolioProject[], today: string): PacedProject[] {
  return projects.map((p) => ({
    ...p,
    pace: computePace({
      status: p.status,
      startDate: p.start_date,
      createdAt: p.created_at,
      deadline: p.deadline,
      workDone: p.taskTotal > 0 ? p.taskDone / p.taskTotal : 0,
      budget: p.budget,
      spent: p.spend,
      today,
      hasTasks: p.taskTotal > 0,
    }),
  }));
}

export function parseLens(value: string | null | undefined): PortfolioLens {
  return PORTFOLIO_LENSES.some((l) => l.id === value) ? (value as PortfolioLens) : "all";
}

export function matchesLens(p: PacedProject, lens: PortfolioLens): boolean {
  switch (lens) {
    case "needs_you":
      return p.pace.needsYou;
    case "active":
      return p.status === "active";
    case "planning":
      return p.status === "planning";
    case "done":
      return p.status === "completed";
    default:
      return true;
  }
}

export function matchesSearch(p: PacedProject, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return p.title.toLowerCase().includes(q) || (p.client?.name ?? "").toLowerCase().includes(q);
}

export function filterPortfolio(projects: PacedProject[], lens: PortfolioLens, query: string): PacedProject[] {
  return projects.filter((p) => matchesLens(p, lens) && matchesSearch(p, query));
}

export function lensCounts(projects: PacedProject[]): Record<PortfolioLens, number> {
  const counts = { all: 0, needs_you: 0, active: 0, planning: 0, done: 0 } as Record<PortfolioLens, number>;
  for (const p of projects) for (const l of PORTFOLIO_LENSES) if (matchesLens(p, l.id)) counts[l.id] += 1;
  return counts;
}

export type ListGroupId = "needs_you" | "on_track" | "planning" | "on_hold" | "done";
const GROUPS: { id: ListGroupId; label: string; test: (p: PacedProject) => boolean }[] = [
  { id: "needs_you", label: "Needs you", test: (p) => p.pace.needsYou },
  { id: "on_track", label: "On track", test: (p) => p.status === "active" && !p.pace.needsYou },
  { id: "planning", label: "Planning", test: (p) => p.status === "planning" },
  { id: "on_hold", label: "On hold", test: (p) => p.status === "on_hold" },
  { id: "done", label: "Done", test: (p) => p.status === "completed" },
];

export function groupForList(projects: PacedProject[]) {
  return GROUPS.map((g) => ({ id: g.id, label: g.label, projects: projects.filter(g.test) })).filter((g) => g.projects.length > 0);
}

/** First project in list order when nothing (or something stale) is requested. */
export function resolveSelection(projects: PacedProject[], requestedId: string | null): { id: string | null; invalid: boolean } {
  const first = groupForList(projects)[0]?.projects[0]?.id ?? null;
  if (requestedId && projects.some((p) => p.id === requestedId)) return { id: requestedId, invalid: false };
  return { id: first, invalid: requestedId !== null };
}

/**
 * List view selection. A requested project that exists but is hidden by the
 * current lens/search is not a broken link — just show the first visible one.
 */
export function selectForList(all: PacedProject[], visible: PacedProject[], requestedId: string | null): { id: string | null; invalid: boolean } {
  const invalid = requestedId !== null && !all.some((p) => p.id === requestedId);
  if (requestedId && visible.some((p) => p.id === requestedId)) return { id: requestedId, invalid: false };
  return { id: groupForList(visible)[0]?.projects[0]?.id ?? null, invalid };
}

export type PortfolioPatch = { id: string; status?: ProjectStatus; start_date?: string; deadline?: string };

/** Optimistic board/timeline edits layered over server data; pace recomputed. */
export function applyPatches(projects: PacedProject[], patches: PortfolioPatch[], today: string): PacedProject[] {
  if (patches.length === 0) return projects;
  // withPace recomputes `pace`, overwriting the stale one carried by the spread.
  const merged: PortfolioProject[] = projects.map((p) => {
    const patch = patches.filter((x) => x.id === p.id).reduce<Partial<PortfolioProject>>((acc, x) => ({ ...acc, ...x }), {});
    return { ...p, ...patch };
  });
  return withPace(merged, today);
}
