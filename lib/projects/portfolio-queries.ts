import { unstable_cache } from "next/cache";

import { listProjects } from "@/lib/projects/actions";
import { summarizeProjectWork, type PortfolioProject, type PortfolioTaskInput } from "@/lib/projects/portfolio-summary";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";

type WorkRow = {
  id: string;
  spent: number | null;
  tasks: PortfolioTaskInput[] | null;
  expenses: { amount: number }[] | null;
  project_milestones: { id: string; title: string; due_date: string | null }[] | null;
};

const _cachedPortfolioWork = unstable_cache(
  async (userId: string): Promise<{ ok: true; rows: WorkRow[] } | { ok: false; message: string }> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id, spent, tasks ( id, title, status, due_date, sort_order, parent_task_id ), expenses ( amount ), project_milestones ( id, title, due_date )",
      )
      .eq("user_id", userId)
      // Expenses carry their own owner; never count another user's rows.
      .eq("expenses.user_id", userId)
      .neq("status", "archived");
    if (error) return { ok: false, message: error.message };
    return { ok: true, rows: (data ?? []) as unknown as WorkRow[] };
  },
  ["projects-portfolio-work"],
  { revalidate: 60, tags: ["projects", "tasks", "expenses"] },
);

/** listProjects rows (cached, client-hydrated) + per-project work aggregates. */
export async function listProjectsPortfolio(): Promise<
  { ok: true; projects: PortfolioProject[] } | { ok: false; message: string }
> {
  const { user } = await getServerContext();
  if (!user) return { ok: false, message: "Not authenticated." };
  const [projectsResult, workResult] = await Promise.all([listProjects(), _cachedPortfolioWork(user.id)]);
  if (!projectsResult.ok) return { ok: false, message: projectsResult.message };
  if (!workResult.ok) return { ok: false, message: workResult.message };
  const work = new Map(workResult.rows.map((r) => [r.id, r]));
  return {
    ok: true,
    projects: projectsResult.projects
      .filter((p) => p.status !== "archived")
      .map((p) => {
        const w = work.get(p.id);
        return {
          ...p,
          ...summarizeProjectWork({
            manualSpent: Number(p.spent ?? 0),
            tasks: w?.tasks ?? [],
            expenses: w?.expenses ?? [],
            milestones: w?.project_milestones ?? [],
          }),
        };
      }),
  };
}
