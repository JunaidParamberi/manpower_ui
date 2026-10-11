import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusKey =
  | "paid"
  | "sent"
  | "draft"
  | "overdue"
  | "partially_paid"
  | "written_off"
  | "active"
  | "planning"
  | "on_hold"
  | "done"
  | "todo"
  | "in_progress"
  | "cancelled"
  | "high"
  | "med"
  | "low"
  | "approved"
  | "declined"
  | "pending"
  | "receipt"
  | "upcoming"
  | "completed";

type StatusConfig = {
  label: string;
  variant: "success" | "warning" | "danger" | "info" | "outline" | "secondary" | "default" | "accent";
};

const STATUS_MAP: Record<StatusKey, StatusConfig> = {
  paid:            { label: "Paid",            variant: "success" },
  approved:        { label: "Approved",        variant: "success" },
  done:            { label: "Done",            variant: "success" },
  completed:       { label: "Completed",       variant: "success" },
  active:          { label: "Active",          variant: "success" },

  sent:            { label: "Sent",            variant: "info" },
  in_progress:     { label: "In progress",     variant: "info" },

  draft:           { label: "Draft",           variant: "outline" },
  todo:            { label: "To do",           variant: "outline" },
  planning:        { label: "Planning",        variant: "outline" },
  upcoming:        { label: "Upcoming",        variant: "outline" },
  pending:         { label: "Pending",         variant: "outline" },
  receipt: { label: "Receipt",          variant: "outline" },

  partially_paid:  { label: "Partial",         variant: "warning" },
  on_hold:         { label: "On Hold",         variant: "warning" },
  med:             { label: "Med",             variant: "warning" },

  overdue:         { label: "Overdue",         variant: "danger" },
  cancelled:       { label: "Cancelled",       variant: "danger" },
  declined:        { label: "Declined",        variant: "danger" },
  written_off:     { label: "Written Off",     variant: "danger" },
  high:            { label: "High",            variant: "danger" },

  low:             { label: "Low",             variant: "secondary" },
};

type StatusBadgeProps = {
  status: StatusKey | string;
  dot?: boolean;
  className?: string;
};

export function StatusBadge({ status, dot = false, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status as StatusKey];
  const label = config?.label ?? status.replace(/_/g, " ");
  const variant = config?.variant ?? "outline";

  return (
    <Badge
      variant={variant}
      className={cn(
        dot &&
          "gap-1.5 before:size-1.5 before:shrink-0 before:rounded-full before:bg-current",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
