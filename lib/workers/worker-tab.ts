export const WORKER_TABS = [
  "overview",
  "documents",
  "clients",
  "accommodation",
  "timesheets",
  "about",
] as const;
export type WorkerTab = (typeof WORKER_TABS)[number];

export function parseWorkerTab(value: string | string[] | null | undefined): WorkerTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "details") return "about"; // legacy alias
  return (WORKER_TABS as readonly string[]).includes(raw ?? "") ? (raw as WorkerTab) : "overview";
}
