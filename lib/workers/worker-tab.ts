export const WORKER_TABS = ["details", "documents", "accommodation", "timesheets"] as const;
export type WorkerTab = (typeof WORKER_TABS)[number];

export function parseWorkerTab(value: string | string[] | null | undefined): WorkerTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return (WORKER_TABS as readonly string[]).includes(raw ?? "") ? (raw as WorkerTab) : "details";
}
