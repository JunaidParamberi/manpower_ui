import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddWorkerButton() {
  return (
    <Button nativeButton={false} render={<Link href="/workers/new" />}>
      <Plus />
      Add worker
    </Button>
  );
}
