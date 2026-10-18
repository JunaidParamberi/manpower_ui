import type { WorkerListRow } from "@/types";

/** `listWorkers` already orders by name; the first row is a stable default. */
export function pickDefaultWorker(
  workers: WorkerListRow[],
): WorkerListRow | null {
  return workers[0] ?? null;
}
