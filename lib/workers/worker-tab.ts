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

export type WorkerHrefOptions = {
  tab?: WorkerTab;
  /** Link to the edit page instead of the detail. */
  edit?: boolean;
  /** List filters to carry over, so navigating inside the detail pane doesn't reset the list. */
  q?: string | null;
  lens?: string | null;
};

/** Href for one worker, keeping the list's q/lens and setting ?tab (overview omits it). */
export function workerHref(workerId: string, options: WorkerHrefOptions = {}): string {
  const base = options.edit ? `/workers/${workerId}/edit` : `/workers/${workerId}`;
  const params = new URLSearchParams();
  const q = options.q?.trim();
  if (q) params.set("q", q);
  if (options.lens && options.lens !== "all") params.set("lens", options.lens);
  if (options.tab && options.tab !== "overview") params.set("tab", options.tab);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
