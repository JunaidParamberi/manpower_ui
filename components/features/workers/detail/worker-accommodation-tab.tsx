import { Home } from "lucide-react";

export function WorkerAccommodationTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 px-6 py-16 text-center">
      <Home className="size-8 text-muted-foreground" />
      <p className="font-medium">No accommodation assigned yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Camp and room assignment isn&apos;t set up yet. This tab will show the worker&apos;s bed allocation once that&apos;s added.
      </p>
    </div>
  );
}
