import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Icon-only "+" for pane headers. */
export function AddWorkerButton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Button
        size="icon-sm"
        nativeButton={false}
        render={<Link href="/workers/new" />}
        aria-label="New worker"
        title="New worker"
      >
        <Plus />
      </Button>
    );
  }
  return (
    <Button nativeButton={false} render={<Link href="/workers/new" />}>
      <Plus />
      Add worker
    </Button>
  );
}
