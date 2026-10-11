import type { DocumentStatus } from "@/types";
import type { SortKey, StatusFilter } from "./types";

const VALID_SORTS: SortKey[] = [
  "date_asc",
  "date_desc",
  "amount_asc",
  "amount_desc",
  "client_asc",
  "client_desc",
  "status_asc",
  "status_desc",
];

const VALID_STATUSES: (DocumentStatus | "overdue" | "outstanding")[] = [
  "draft",
  "sent",
  "viewed",
  "signed",
  "paid",
  "partially_paid",
  "written_off",
  "archived",
  "approved",
  "declined",
  "overdue",
  "outstanding",
];

export function parsePageParam(s: string | undefined): number {
  const n = parseInt(s ?? "1", 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

export function parseSortParam(s: string | undefined): SortKey {
  if (s && (VALID_SORTS as string[]).includes(s)) return s as SortKey;
  return "date_desc";
}

export function parseSearchParam(s: string | undefined): string | undefined {
  const trimmed = s?.trim();
  return trimmed || undefined;
}

export function parseStatusParam(s: string | undefined): StatusFilter | undefined {
  if (s && (VALID_STATUSES as string[]).includes(s)) return s as StatusFilter;
  return undefined;
}
