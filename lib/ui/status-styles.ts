import { cn } from "@/lib/utils";

export const STATUS_STYLES = {
  // Document statuses
  draft:          { bg: "bg-muted",           text: "text-muted-foreground" },
  sent:           { bg: "bg-primary/10",      text: "text-primary" },
  viewed:         { bg: "bg-primary/10",      text: "text-primary" },
  paid:           { bg: "bg-emerald-500/12",  text: "text-emerald-700 dark:text-emerald-400" },
  partially_paid: { bg: "bg-amber-500/12",    text: "text-amber-700 dark:text-amber-400" },
  overdue:        { bg: "bg-destructive/10",  text: "text-destructive" },
  written_off:    { bg: "bg-muted",           text: "text-muted-foreground italic" },
  declined:       { bg: "bg-destructive/10",  text: "text-destructive" },
  approved:       { bg: "bg-emerald-500/12",  text: "text-emerald-700 dark:text-emerald-400" },
  cancelled:      { bg: "bg-muted",           text: "text-muted-foreground" },
  // Project statuses
  active:         { bg: "bg-primary/10",      text: "text-primary" },
  planning:       { bg: "bg-muted",           text: "text-muted-foreground" },
  on_hold:        { bg: "bg-amber-500/12",    text: "text-amber-700 dark:text-amber-400" },
  completed:      { bg: "bg-emerald-500/12",  text: "text-emerald-700 dark:text-emerald-400" },
  archived:       { bg: "bg-muted",           text: "text-muted-foreground" },
} as const;

export type StatusKey = keyof typeof STATUS_STYLES;

/** Full-pill status badge className string. */
export function statusPillClass(status: string): string {
  const style = STATUS_STYLES[status as StatusKey] ?? STATUS_STYLES.draft;
  return cn(
    "inline-flex h-5 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap",
    style.bg,
    style.text,
  );
}
