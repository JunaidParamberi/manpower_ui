import { Clock } from "lucide-react";

export function WorkerTimesheetsTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 px-6 py-16 text-center">
      <Clock className="size-8 text-muted-foreground" />
      <p className="font-medium">No timesheets recorded yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Timesheet tracking isn&apos;t set up yet. This tab will show logged hours once that&apos;s added.
      </p>
    </div>
  );
}
